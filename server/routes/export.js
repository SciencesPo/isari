'use strict'

const XLSX = require('xlsx')
const { Router } = require('express')
const { ClientError, ServerError } = require('../lib/errors')
const models = require('../lib/model')

// Routines
const XLSX_ROUTINES = {
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

const VIABLE_ANNEX4_TABS = new Set(['1'])

const HTML_ROUTINES = {
	annex4: {
		fn(query) {
			return require('../export/annex4.js')[query.tab]
		},
		args(query, next) {
			return [models, query.id, next]
		},
		check(query) {
			if (!query.id)
				return false

			if (!VIABLE_ANNEX4_TABS.has(query.tab))
				return false

			return true
		}
	}
}

// Mime types
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// TODO: WARNING - Need to handle permission!
module.exports = Router()
.get('/html/:name', sendHtmlExport)
.get('/xlsx/:name', sendXlsxExport)

function sendHtmlExport(req, res) {
	const name = req.params.name
	const query = req.query
	const routine = HTML_ROUTINES[name]

	if (!routine)
		return res
      .status(400)
      .send(ClientError({title: `Unknown HTML export "${name}"`, status: 400}))

	if (!routine.check(query))
		return res
      .status(400)
      .send(ClientError({title: 'Invalid arguments.', status: 400}))

	return routine.fn(query).apply(null, routine.args(query, (err, html) => {
  	if (err)
		return res.status(500).send(ServerError())

		return res.status(200).send(html)
	}))
}

function sendXlsxExport(req, res) {
	const name = req.params.name
	const query = req.query
	const routine = XLSX_ROUTINES[name]

	if (!routine)
		return res
      .status(400)
      .send(ClientError({title: `Unknown XLSX export "${name}"`, status: 400}))

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
