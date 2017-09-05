const { connect } = require('../../server/lib/model')
const { EditLog, flattenDiff, cleanupData } = require('../../server/lib/edit-logs')
const chalk = require('chalk')


const cleanupAll = logs => {
	//console.log('COUNT LOGS', logs.length)
	return logs.map(cleanupOne).filter(log => log !== null)
}

const cleanupOne = log => {
	//console.log('CHECK LOG', log)
	switch(log.action) {
	case 'delete': return null
	case 'create': {
		const data = fixData(log.data)
		return data ? Object.assign(log, { data }) : null
	}
	case 'update': {
		const diff = fixDiff(log.diff)
		return diff ? Object.assign(log, { diff }) : null
	}
	default: return null
	}
}

const fixDiff = diff => {
	let modified = false

	// First, flatten those weird diffs
	const originalDiff = diff
	diff = flattenDiff(diff)

	// MongoId instance: 2 changes FIELD._bsontype = 'ObjectID' + FIELD.id = buffer → replace with hex string
	/*
	{ kind: 'D', path: [ 'academicMemberships', 0, 'organization', '_bsontype' ], lhs: 'ObjectID' }
	{ kind: 'D', path: [ 'academicMemberships', 0, 'organization', 'id' ], lhs: Binary { ...buffer: <Buffer 58 94 88 9a 11 d0 d1 00 38 1b cc 97> } }
	*/
	const mongoIdCouple = (d1, d2) => {
		if (d1.path[d1.path.length - 1] === '_bsontype' && d1.lhs === 'ObjectID' && d2.path[d2.path.length - 1] === 'id') {
			return { field: 'lhs', value: d2.lhs.buffer.toString('hex') }
		} else if (d1.path[d1.path.length - 1] === '_bsontype' && d1.rhs === 'ObjectID' && d2.path[d2.path.length - 1] === 'id') {
			return { field: 'rhs', value: d2.rhs.buffer.toString('hex') }
		}
	}
	for (let i = 0; i < diff.length - 1; i++) {
		const curr = diff[i]
		const next = diff[i + 1]
		const c1 = mongoIdCouple(curr, next)
		if (c1) {
			next[c1.field] = c1.value
			next.path.pop() // FIELD.id → FIELD
			diff[i] = null
			modified = true
		}
	}

	// Populated data: FIELD._id exists as ObjectID → replace with hex string, remove all other FIELD.*
	const pathDir = d => d.path.slice(0, d.path.length - 1).join('/')
	const idDiffs = diff.filter(d => d && d.path.length > 1 && d.path[d.path.length - 1] === '_id')
	if (idDiffs.length > 0) {
		modified = true
	}
	idDiffs.forEach(d => {
		if (!d) {
			return
		}
		const dir = pathDir(d)
		diff = diff.filter(dd => {
			if (dd && pathDir(dd) === dir) {
				// FIELD._id → mutate
				if (dd.path[dd.path.length - 1] === '_id') {
					// Replace object with the id itself
					dd.path.pop()
					if (dd.rhs) {
						dd.rhs = dd.rhs.toHexString()
					} else if (dd.lhs) {
						dd.lhs = dd.lhs.toHexString()
					}
					return true
				}
				// FIELD.* → do not include
				else {
					return false
				}
			} else {
				// Other fields → include with no question
				return true
			}
		})
	})

	// Now we may have solved common diff corruption issue, when a FK was not actually modified but just populated
	// This means we came from a big diff like
	/*
	{"kind":"D","path":["grades",0,"grade"],"lhs":"STAGE"}
	{"kind":"D","path":["academicMemberships",0,"organization","_bsontype"],"lhs":"ObjectID"}
	{"kind":"D","path":["academicMemberships",0,"organization","id"],"lhs":Binary(…)}
	{"kind":"N","path":["academicMemberships",0,"organization","_id"],"rhs":ObjectID(…)}
	{"kind":"N","path":["academicMemberships",0,"organization","name"],"rhs":"Centre de recherches politiques"}
	{"kind":"N","path":["academicMemberships",0,"organization","address"],"rhs":"…"}
	…
	*/
	// to a very lighter one like
	/*
	{"kind":"D","path":["grades",0,"grade"],"lhs":"STAGE"}
	{"kind":"D","path":["academicMemberships",0,"organization"],"lhs":"5894889a11d0d100381bcc97"}
	{"kind":"N","path":["academicMemberships",0,"organization"],"rhs":"5894889a11d0d100381bcc97"}
	*/
	// Let's refactor deleted/new that cancel each other
	diff.forEach((dDiff, dDiffIndex) => {
		if (dDiff && dDiff.kind === 'D' && dDiff.lhs) {
			const dp = dDiff.path.join('/')
			const nDiffIndex = diff.findIndex(d => d && d.kind === 'N' && dp === d.path.join('/') && d.rhs)
			if (nDiffIndex !== -1) {
				const nDiff = diff[nDiffIndex]
				// Now compare the both elements: same value = delete both, different value = make it a 'edit' change
				if (dDiff.lhs === nDiff.rhs) {
					diff[dDiffIndex] = null
					diff[nDiffIndex] = null
					// console.log('FOUND CORRESPONDING D/N', nDiff, dDiff)
				} else {
					diff[nDiffIndex] = null
					dDiff.kind = 'E'
					dDiff.rhs = nDiff.rhs
					// console.log('FOUND EDIT D/N', dDiff)
				}
			}
		}
	})

	// Remove filtered changes
	diff = diff.filter(d => d !== null)

	// if (modified) console.log({ originalDiff, diff })

	return modified && diff
}

const fixData = data => cleanupData(data, false, true)

connect()
.then(() => EditLog.find())
.then(cleanupAll)
.then(logs => {
	console.log('Modified logs', logs.length) // eslint-disable-line no-console
	let errors = []
	let ok = 0
	const allSaved = Promise.all(logs.map(log => log.save()
		.then(() => {
			process.stdout.write(chalk.green('.'))
			ok++
		})
		.catch(e => {
			errors.push([log, e])
			process.stderr.write(chalk.red('.'))
		})
	))
	return allSaved.then(() => {
		process.stdout.write('\n')
		process.stderr.write('\n')
		console.log('[OK] %s EditLog entries updated', ok)
		if (errors.length > 0) {
			errors.forEach(([ log, e ]) => {
				console.error('[ERR] Log #%s: %s', log.id, e.message) // eslint-disable-line no-console
			})
			throw new Error('Error(s) occurred')
		}
	})
})
.then(() => {
	process.exit(0)
})
.catch(e => {
	console.error(e) // eslint-disable-line no-console
	process.exit(1)
})
