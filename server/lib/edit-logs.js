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

	if (!doc._elWho) {
		// TODO use proper logger
		const stack = Error().stack.split('\n').slice(2).join('\n')
		process.stderr.write(chalk.yellow(`[EditLog][${modelName}] No _elWho set, operation will be logged anonymously\n`))
		process.stderr.write(chalk.yellow(stack) + '\n\n')
	}

	return [ modelName, doc._elWho ]
}

const middleware = schema => {

	schema.post('save', doc => {
		const [modelName, who] = getWho(doc)

		// Create a EditLog instance
		const log = new EditLog({
			model: modelName,
			date: new Date(),
			action: doc.isNew ? 'create' : 'update',
			who,
			data: doc.toObject()
		})

		// Save it asynchronously
		log.save()
	})

	schema.post('remove', doc => {
		const [modelName, who] = getWho(doc)

		if (!doc._elWho) {
			// TODO use proper logger
			const stack = Error().stack.split('\n').slice(2).join('\n')
			process.stderr.write(chalk.yellow(`[EditLog][${modelName}] No _elWho set, operation will be logged anonymously\n`))
			process.stderr.write(chalk.yellow(stack) + '\n\n')
		}

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
