#!/usr/bin/env node

const path = require('path')
process.chdir(path.join(__dirname, '..', '..', 'server'))

const { connect } = require('../../server/lib/model')
const { EditLog, flattenDiff, cleanupData, isEmptyDiff } = require('../../server/lib/edit-logs')
const { set, get } = require('lodash')
const chalk = require('chalk')


const cleanupAll = logs => {
	//console.log('COUNT LOGS', logs.length)
	let logsToSave = {}
	let logsToDelete = {}
	const fixLog = log =>
		Promise.resolve(cleanupOne(log, logs))
		.then(modified => {
			if (modified === true) {
				logsToSave[log.id] = log
			} else if (modified === 'delete') {
				logsToDelete[log.id] = log
			}
		})
	return Promise.all(logs.map(fixLog)).then(() => ({
		save: Object.values(logsToSave),
		remove: Object.values(logsToDelete),
	}))
}

const cleanupOne = (log, logs) => {
	//console.log('CHECK LOG', log)
	switch(log.action) {
	case 'delete': return null
	case 'create': return fixData(log, logs)
	case 'update': return fixDiff(log, logs)
	default: return null
	}
}

const PATH_SEPARATOR = '.'
const pathString = d => d && d.path && d.path.join(PATH_SEPARATOR)
const pathDir = d => d && d.path && d.path.slice(0, d.path.length - 1).join(PATH_SEPARATOR)

const fixDiff = (log, logs) => {
	let modified = false
	let changes = log.diff

	// First, flatten those weird diffs (if necessary)
	let shouldFlatten = changes.some(Array.isArray)
	if (shouldFlatten) {
		changes = flattenDiff(changes)
		// console.log(chalk.blue.bold('MODIFY: flatten'))
		modified = true
	}

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
	for (let i = 0; i < changes.length - 1; i++) {
		const curr = changes[i]
		const next = changes[i + 1]
		const c1 = mongoIdCouple(curr, next)
		if (c1) {
			next[c1.field] = c1.value
			next.path.pop() // FIELD.id → FIELD
			changes[i] = null
			// console.log(chalk.blue.bold('MODIFY: ObjectID to string'))
			modified = true
		}
	}

	// Populated data: FIELD._id exists as ObjectID → replace with hex string, remove all other FIELD.*
	const idDiffs = changes.filter(d => d && d.path.length > 1 && d.path[d.path.length - 1] === '_id')
	if (idDiffs.length > 0) {
		// console.log(chalk.blue.bold('MODIFY: unpopulate'))
		modified = true
	}
	idDiffs.forEach(d => {
		if (!d) {
			return
		}
		const dir = pathDir(d)
		changes = changes.filter(dd => {
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
	changes.forEach((dDiff, dDiffIndex) => {
		if (dDiff && dDiff.kind === 'D' && dDiff.lhs) {
			const dp = pathString(dDiff)
			const nDiffIndex = changes.findIndex(d => d && d.kind === 'N' && dp === pathString(d) && d.rhs)
			if (nDiffIndex !== -1) {
				const nDiff = changes[nDiffIndex]
				// Now compare the both elements: same value = delete both, different value = make it a 'edit' change
				if (dDiff.lhs === nDiff.rhs) {
					changes[dDiffIndex] = null
					changes[nDiffIndex] = null
					// console.log('FOUND CORRESPONDING D/N', nDiff, dDiff)
				} else {
					changes[nDiffIndex] = null
					dDiff.kind = 'E'
					dDiff.rhs = nDiff.rhs
					// console.log('FOUND EDIT D/N', dDiff)
				}
			}
		}
	})

	// Remove filtered changes
	changes = changes.filter(d => d !== null)

	// if (modified) console.log({ originalDiff, diff })

	log.diff = changes

	modified = fixEmptyDiff(log, modified)

	if (modified !== 'delete') {
		modified = fixObjectIDDiffs(log, logs, modified)
	}

	return modified
}

const fixEmptyDiff = (log, modified) =>
	log.action === 'update' && isEmptyDiff(log.diff) ? 'delete' : modified

const isInnerChangeInObjectID = d =>
	d.path[d.path.length - 2] === 'id' && Number(d.path[d.path.length - 1]) >= 0

const isFull = changes => {
	// Collection of changes is full iff the 12 first changes are all edits on keys 0 to 11
	const edits = changes.filter(d => d.kind === 'E' && Number(d.path[d.path.length - 1]) >= 0)
	if (edits.length !== 12) {
		//console.log(chalk.yellow('Ooops, wrong number of edits: ' + edits.length))
		return false
	}
	const keys = edits.map(d => d.path[d.path.length - 1]).sort()
	if (keys.join('.') !== '0.1.10.11.2.3.4.5.6.7.8.9') {
		//console.log(chalk.yellow('Oooops, wrong keys met: ' + String(keys)))
		return false
	}
	return true
}

function fakeObjectIdToString () {
	return this.id.toString('hex')
}

const fixObjectIDDiffs = (log, logs, modified) => {
	// When ObjectID is changed, that dumbass stored FIELD.id.INDEX changes one by one...
	const innerChangesInObjectIDs = log.diff.filter(isInnerChangeInObjectID)

	if (innerChangesInObjectIDs.length === 0) {
		return modified
	}

	// Example: [ 'personalActivities.8.organizations.0.id', 'personalActivities.9.organizations.0.id', 'personalActivities.10.organizations.0.id' ]
	const paths = [...new Set(innerChangesInObjectIDs.map(d => pathDir(d)))]

	// Remove all those changes from initial diff, we'll add them back after
	log.diff = log.diff.filter(d => !isInnerChangeInObjectID(d))

	// There are diffs like 'PATH.0', 'PATH.1', etc… Replay the whole history of changes
	// to convert them into simple string replacements when possible
	//console.log('SHOULD FIX OBJECT ID DIFF IN LOG', log.id, innerChangeInObjectIDs.length)
	//console.log('FIND ALL DIFFS FOR CORRESPONDING ITEM, AND REPLAY (so cool)')
	const itemId = String(log.item)
	paths.forEach(path => {
		const parentPath = path.split(PATH_SEPARATOR).slice(0, -1).join(PATH_SEPARATOR)

		console.log(chalk.blue.bold('ObjectID inner diff: Log#%s %s#%s %s'), log.id, log.model, log.item, path)
		const logPathChanges = innerChangesInObjectIDs.filter(d => pathDir(d) === path)

		// Case 1: the log contains a full change of id (keys 0-11)
		if (isFull(logPathChanges)) {
			let lBits = []
			let rBits = []
			logPathChanges.forEach(d => {
				if (d.kind === 'E' && pathDir(d) === path) {
					const index = Number(d.path[d.path.length - 1])
					lBits[index] = d.lhs
					rBits[index] = d.rhs
				}
			})
			log.diff.push({
				kind: 'E',
				path: logPathChanges[0].path.slice(0, -1),
				lhs: new Buffer(lBits).toString('hex'),
				rhs: new Buffer(rBits).toString('hex'),
			})
			modified = true
			return // next path
		}

		const history = logs
			.filter(l => String(l.item) === itemId && l.date < log.date)
			// Note: at this point, log.diff does not contain our inner changes, so we need to add it manually
			.concat([Object.assign({}, log, { diff: innerChangesInObjectIDs })])
		if (history[0].action === 'create') {
			console.log(chalk.green('OK: we have an initial creation, replay history')) // eslint-disable-line no-console
			let data = history[0].data
			const getValue = () => get(data, parentPath)
			let lhs = String(getValue())
			//console.log(require('util').inspect(data,{colors:true,depth:10}))
			let failed = false
			for (let i = 1; i < history.length; i++) {
				(history[i].diff || []).forEach(change => {
					const currPath = pathString(change)
					//console.log(currPath)
					if (!path.startsWith(currPath) && !currPath.startsWith(path)) {
						return // skip uninteresting change
					}
					//console.log(change)
					// Note: shit can happen when previous diff had a stringified ObjectID and next change is about changing a bit of it
					// Detect and handle this edge case now
					const value = getValue()
					if (currPath.startsWith(path) && typeof value === 'string') {
						//console.log(chalk.red('HANDLE EDGE CASE'))
						try {
							set(data, parentPath, { id: Buffer.from(value, 'hex'), toString: fakeObjectIdToString })
						} catch (e) {
							console.error(chalk.red('Error occurred while reading ObjectID %s: %s'), value, e.message)
							return (failed = true)
						}
					} else if (typeof value !== 'object') {
						console.error(chalk.red('Error occurred while reading ObjectID %s (unexpected type %s)'), JSON.stringify(value), typeof value)
						return (failed = true)
					}
					data = EditLog.applyChange(data, change)
					if (path.startsWith(currPath)) {
						// Full change
						//console.log('FULL CHANGE')
						lhs = String(getValue())
					}
					//console.log({lhs})
				})
			}
			//console.log({lhs, rhs: String(getValue())})
			if (failed) {
				log.diff.push({ kind: 'E', path: parentPath.split(PATH_SEPARATOR), lhs, rhs: 'N/A (error)' })
			} else {
				log.diff.push({ kind: 'E', path: parentPath.split(PATH_SEPARATOR), lhs, rhs: String(getValue()) })
			}
		} else {
			if (history[history.length - 1].action === 'delete') {
				console.log(chalk.red('FAIL: not enough data to create meaningful changes (item deleted in the end)')) // eslint-disable-line no-console
			} else {
				console.log(chalk.red.bold('FAIL: not enough data to create meaningful changes')) // eslint-disable-line no-console
			}
			log.diff.push({ kind: 'E', path: parentPath.split(PATH_SEPARATOR), lhs: 'N/A', rhs: 'N/A' })
		}

		modified = true
	})

	return modified
}

const fixData = log => {
	const data = cleanupData(log.data, false, true)
	if (data) {
		log.data = data
	}
	return !!data
}

const applyActions = (logs, method, stats) =>
	logs.map(log => log[method]()
		.then(() => {
			process.stdout.write(chalk.green('.'))
			stats[method]++
		})
		.catch(e => {
			stats.errors.push([log, e])
			process.stderr.write(chalk.red('.'))
		})
	)

connect()
.then(() => EditLog.find().sort({ date: 1 }))
.then(cleanupAll)
.then(({ save, remove }) => {
	console.log('Modified logs', save.length) // eslint-disable-line no-console
	console.log('Deleted logs', remove.length) // eslint-disable-line no-console
	const stats = { errors: [], save: 0, remove: 0 }
	return Promise.all(
			applyActions(save, 'save', stats)
			.concat(applyActions(remove, 'remove', stats))
		)
		.then(() => stats)
})
.then(({ errors, save, remove }) => {
	process.stdout.write('\n')
	process.stderr.write('\n')
	console.log('[OK] %s changes in EditLog (%s updated, %s deleted)', save + remove, save, remove) // eslint-disable-line no-console
	if (errors.length > 0) {
		errors.forEach(([ log, e ]) => {
			console.error('[ERR] Log #%s: %s', log.id, e.message) // eslint-disable-line no-console
		})
		throw new Error(errors.length + ' error(s) occurred')
	}
})
.then(() => {
	process.exit(0)
})
.catch(e => {
	console.error(e) // eslint-disable-line no-console
	process.exit(1)
})
