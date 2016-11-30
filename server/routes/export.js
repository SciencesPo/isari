'use strict'

const XLSX = require('xlsx')
const { Router } = require('express')
const { ClientError, ServerError } = require('../lib/errors')
// const { scopeOrganizationMiddleware } = require('../lib/permissions')
const models = require('../lib/model')

// Routines
const ROUTINES = {
	hceres: {
		fn: require('../export/hceres.js'),
		args(query, next) {
			return [models, query.id, next]
		},
		check(query) {
			if (!query.id)
				return false

			return true
		}
	}
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// TODO: WARNING - Need to handle permission!
module.exports = Router()
.get('/:name', sendExport)

function sendExport(req, res) {
	const name = req.params.name,
		query = req.query,
		routine = ROUTINES[name]

	if (!routine)
		return res
      .status(400)
      .send(ClientError({title: `Unknown export "${name}"`, status: 400}))

	if (!routine.check(query))
		return res
      .status(400)
      .send(ClientError({title: 'Invalid arguments.', status: 400}))

	return routine.fn.apply(null, routine.args(query, (err, workbook) => {
		if (err)
			return res.status(500).send(ServerError())

		const buffer = XLSX.write(workbook, {type: 'buffer'})

		res.set('Content-disposition', `attachment; filename=${workbook.name}`)
		res.set('Content-type', XLSX_MIME)

		return res.send(buffer)
	}))
}
