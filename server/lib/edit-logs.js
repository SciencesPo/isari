'use strict'

const mongoose = require('mongoose')
const chalk = require('chalk')


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
	data: {
		type: mongoose.Schema.Types.Mixed,
		required: false
	},
	who: {
		type: String,
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

	schema.pre('save', function (next) {
		const [modelName, who] = getWho(this)

		// Create a EditLog instance
		// Store for post-save
		// We need to create it in pre-save to have a working 'isNew' attr
		this._elLogToBeSaved = new EditLog({
			model: modelName,
			date: new Date(),
			action: this.isNew ? 'create' : 'update',
			who,
			data: this.toObject()
		})

		next()
	})

	schema.post('save', doc => {
		// Save on post-save, to ensure it was actually saved
		if (doc._elLogToBeSaved) {
			doc._elLogToBeSaved.save()
		}
	})

	schema.post('remove', doc => {
		const [modelName, who] = getWho(doc)

		// Create a EditLog instance
		const log = new EditLog({
			model: modelName,
			date: new Date(),
			action: 'delete',
			who,
			data: doc.toObject()
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
