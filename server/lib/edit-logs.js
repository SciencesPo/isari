'use strict'

const mongoose = require('mongoose')
const { diff: deepDiff, applyChange } = require('deep-diff')
const chalk = require('chalk')
const removeEmptyFields = require('./remove-empty-fields')
const { get, set } = require('lodash')

const { ObjectId } = require('mongoose').Types

const EditLogSchema = new mongoose.Schema({
	model: {
		type: String,
		required: true
	},
	date: {
		type: Date,
		required: true
	},
	action: {
		type: String,
		enum: ['create', 'update', 'delete'],
		required: true
	},
	item: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	},
	data: {
		type: mongoose.Schema.Types.Mixed,
		required: false
	},
	diff: {
		type: mongoose.Schema.Types.Mixed,
		required: false
	},
	who: {
		type: mongoose.Schema.Types.Mixed,
		required: false
	},
	whoID: {
		type: mongoose.Schema.Types.ObjectId,
		required: false
	}
})

EditLogSchema.static('applyChange', (source, change) => {
	const target = Object.assign({}, source)
	if (change.kind === 'A' && !get(target, change.path)) {
		set(target, change.path, [])
	}
	applyChange(target, source, change)
	return target
})


const EditLog = mongoose.model('EditLog', EditLogSchema)


const getWho = doc => {
	const who = doc.latestChangeBy

	if (!who) {
		// TODO use proper logger
		const stack = Error().stack.split('\n').slice(2).join('\n')
		process.stderr.write(chalk.yellow(`[EditLog][${modelName}] Field 'latestChangeBy' not set, operation will be logged anonymously\n`))
		process.stderr.write(chalk.yellow(stack) + '\n\n')
		return Promise.resolve({})
	}
	else {
		// fetch info about who in people collection and cache those info
		// This system is a fallback to hydrate who info if an editor user is deleted from DB

		return mongoose.models['People'].findOne({ _id: ObjectId(who) }).then(user => {

			if (user)
				return { id: user._id,
				     name: `${user.firstName ? user.firstName+' ':''}${user.name}`,
				     roles: user.isariAuthorizedCenters ?
							user.isariAuthorizedCenters.map(iac =>({lab:iac.organization,role:iac.isariRole})):
							[]
				 }
			else Promise.reject(Error('People Not Found'))
		})
	}

	
}

const middleware = schema => {

	schema.add({
		latestChangeBy: {
			type: String,
			required: true
		}
	})

	schema.post('init', function () {
		this._original = this.toObject()
	})

	schema.pre('save', function (next) {
		const modelName = this.constructor.modelName
		getWho(this).then((who)=>{
			const data = this.toObject()

			// Create a EditLog instance
			// Store for post-save
			// We need to create it in pre-save to have a working 'isNew' attr
			const editLog = {
				model: modelName,
				item: data._id,
				date: new Date(),
				action: this.isNew ? 'create' : 'update',
				who : who,
				whoID: who.id || ''
			}

			if (this.isNew) {
				editLog.data = data
			}
			else {
				// If the model was updated, we only store a diff
				const changes = flattenDiff(deepDiff(cleanupData(this._original), cleanupData(data)))
				if (isEmptyDiff(changes)) {
					return next() // no edit log inserted for empty diff
				}
				editLog.diff = changes
			}

			this._elLogToBeSaved = new EditLog(editLog)

			next()
		})
	})

	schema.post('save', doc => {
		// Save on post-save, to ensure it was actually saved
		if (doc._elLogToBeSaved) {
			doc._elLogToBeSaved.save()
		}
	})

	// TODO: this will be handled differently when we solve the delete conundrum
	schema.post('remove', doc => {
		const modelName = doc.constructor.modelName
		getWho(doc).then((who)=>{
			// Create a EditLog instance
			const log = new EditLog({
				model: modelName,
				item: doc.id,
				date: new Date(),
				data: doc.toObject(),
				action: 'delete',
				who: who,
				whoID: who.id
			})

			// Save it asynchronously
			log.save()	
		})
	})

}

const isEmptyDiff = changes =>
	// No change at all
	(changes.length === 0) ||
	// The only modified field is 'latestChangeBy', which is pretty meaningless
	(changes.length === 1 && changes[0].path.length === 1 && changes[0].path[0] === 'latestChangeBy')

const flattenDiff = diffs => diffs.map(diff => Array.isArray(diff) && diff.length === 1 ? diff[0] : diff)

const isBinaryObjectId = v =>
	(v instanceof mongoose.mongo.ObjectID) ||
	// Duck-typing
	(typeof v === 'object' && v !== null && Buffer.isBuffer(v.id))

/**
 * (T, bool?, bool?) => T | null
 *
 * Recursively clean up an object:
 * - Remove special fields (_id, __v, etc.)
 * - FKs: Replace populated sub-documents or binary ObjectIDs into simple string
 *
 * Return new clean object, if it's not been modified and returnNullIfNotModified
 * is set to true, then only return null
 */
const cleanupData = (data, isDeep = false, returnNullIfNotModified = false) => {
	// Handle scalar values (string, bool, etc… undefined, and null too)
	if (typeof data !== 'object' || data === null) {
		return returnNullIfNotModified ? null : data
	}

	// Be careful if we receive a Mongoose instance, convert it first
	if (!isDeep && typeof data.$__ === 'object' && typeof data.toObject === 'function') {
		data = data.toObject()
	}

	// Handle FKs:
	// Case 1: binary ObjectID
	if (isBinaryObjectId(data)) {
		return asID(data)
	}
	// Case 2: populated sub-documents
	if (isDeep && typeof data === 'object' && isBinaryObjectId(data._id)) {
		return getID(data)
	}
	// Other cases of FKs: raw values (string) have been handled previously
	// There are not other 'object' forms of FK

	// Standard case, clean up every property recursively
	let modified = false // remember if object has been modified during the process
	const newData = Object.keys(data).reduce((res, k) => {
		// Remove special fields: do NOT append to 'res', but mark as modified
		if (k !== '_id' && k[0] === '_') {
			modified = true
		}
		// Collection: recursive cleanup
		else if (Array.isArray(data[k])) {
			let arrayModified = false
			const newArray = data[k].map(o => {
				const o2 = cleanupData(o, true)
				arrayModified = arrayModified || o !== o2
				return o2
			})
			res[k] = arrayModified ? newArray : data[k]
			modified = modified || arrayModified
		}
		// Other cases: recursive cleanup
		else {
			res[k] = cleanupData(data[k], true)
			modified = modified || res[k] !== data[k]
		}

		return res
	}, {})

	// not modified ? return null or original instance
	// otherwise, return new data
	if (!modified) {
		return returnNullIfNotModified ? null : data
	} else {
		return newData
	}
}

const getID = o => o && (asID(o._id) || asID(o.id))

const asID = id => id && (id.toHexString ? id.toHexString() : String(id))


module.exports = {
	EditLogSchema,
	EditLog,
	middleware,
	cleanupData,
	flattenDiff,
	isEmptyDiff,
}
