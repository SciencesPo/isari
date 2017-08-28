'use strict'

const mongoose = require('mongoose')
const deepDiff = require('deep-diff').diff
const chalk = require('chalk')
const removeEmptyFields = require('./remove-empty-fields')


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
		type: mongoose.Schema.Types.Array,
		required: false
	},
	who: {
		type: String,
		required: false
	},
	whoID: {
		type: mongoose.Schema.Types.ObjectId,
		required: false
	}
})


const EditLog = mongoose.model('EditLog', EditLogSchema)


const getWho = doc => {
	const modelName = doc.constructor.modelName
	const who = doc.latestChangeBy

	if (!who) {
		// TODO use proper logger
		const stack = Error().stack.split('\n').slice(2).join('\n')
		process.stderr.write(chalk.yellow(`[EditLog][${modelName}] Field 'latestChangeBy' not set, operation will be logged anonymously\n`))
		process.stderr.write(chalk.yellow(stack) + '\n\n')
	}

	return [ modelName, who ]
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
		const [modelName, who] = getWho(this)
		const data = this.toObject()

		// Create a EditLog instance
		// Store for post-save
		// We need to create it in pre-save to have a working 'isNew' attr
		const editLog = {
			model: modelName,
			item: data._id,
			date: new Date(),
			action: this.isNew ? 'create' : 'update',
			whoID: who
		}

		if (this.isNew) {
			editLog.data = removeEmptyFields(data)
		}
		else {

			// If the model was updated, we only store a diff
			const diff = deepDiff(this._original, data)
			editLog.diff = diff
		}

		this._elLogToBeSaved = new EditLog(editLog)

		next()
	})

	schema.post('save', doc => {
		// Save on post-save, to ensure it was actually saved
		if (doc._elLogToBeSaved) {
			doc._elLogToBeSaved.save()
		}
	})

	// TODO: this will be handled differently when we solve the delete conundrum
	schema.post('remove', doc => {
		const [modelName, who] = getWho(doc)

		// Create a EditLog instance
		const log = new EditLog({
			model: modelName,
			item: doc.id,
			date: new Date(),
			data: removeEmptyFields(doc.toObject()),
			action: 'delete',
			who
		})

		// Save it asynchronously
		log.save()
	})

}


module.exports = {
	EditLogSchema,
	EditLog,
	middleware
}
