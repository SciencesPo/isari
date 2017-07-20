'use strict'

const XLSX = require('xlsx')
const { Router } = require('express')
const { ClientError, ServerError } = require('../lib/errors')
const models = require('../lib/model')

// Routines
const XLSX_ROUTINES = {
	hceres: {
		fn: require('../export/hceres.js'),
		args(req, next) {
			return [models, req.query.id, next]
		},
		check(query) {
			if (!query.id)
				return false

			return true
		}
	},
	next: {
		fn: require('../export/next.js'),
		args(req, next) {
			return [models, req.query.id, next]
		},
		check(query) {
			if (!query.id)
				return false

			return true
		}
	},
	staff: {
		fn: require('../export/staff.js'),
		args(req, next) {
			//range
			let range = []
			if (req.query.start)
				range.push(req.query.start)
			if (req.query.end)
				range.push(req.query.end)
			range = range.sort()
			//role
			const role = req.userCentralRole ?  'central_'+req.userCentralRole : req.userRoles[req.query.id]
			
			return [models, req.query.id, range, role, next]
		},
		check(query) {
			return true
		}
	},
	grants: {
		fn: require('../export/grants.js'),
		args(req, next) {
			//range
			let range = []
			if (req.query.start)
				range.push(req.query.start)
			if (req.query.end)
				range.push(req.query.end)
			range = range.sort()
			//role
			const role = req.userCentralRole ?  'central_'+req.userCentralRole : req.userRoles[req.query.id]
			
			return [models, req.query.id, range, role, next]
		},
		check(query) {
			return true
		}
	}
}

const HTML_ROUTINES = {
	annex4: {
		fn: require('../export/annex4.js'),
		args(req, next) {
			return [models, req.query.id, next]
		},
		check(query) {
			if (!query.id)
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
	let query = req.query
	const routine = HTML_ROUTINES[name]

	if (!routine)
		return res
			.status(400)
			.send(ClientError({title: `Unknown HTML export "${name}"`, status: 400}))

	if (!routine.check(query))
		return res
			.status(400)
			.send(ClientError({title: 'Invalid arguments.', status: 400}))

	return routine.fn.apply(null, routine.args(req, (err, html) => {
		if (err)
			return res.status(500).send(ServerError())

		return res.status(200).send(html)
	}))
}

function sendXlsxExport(req, res) {
	const name = req.params.name
	const query = req.query
	const routine = XLSX_ROUTINES[name]

	//check rights to export the requested id.s
	if ((req.userRoles && !Object.keys(req.userRoles).includes(query.id) && query.id !== '' && !req.userCentralRole) ||
		(!req.userCentralRole && query.id === ''))
		return res
			.status(403)
			.send(ClientError({title: `Access forbidden for this/those organization.s`, status: 403}))

	if (!routine)
		return res
			.status(400)
			.send(ClientError({title: `Unknown XLSX export "${name}"`, status: 400}))

	if (!routine.check(query))
		return res
			.status(400)
			.send(ClientError({title: 'Invalid arguments.', status: 400}))

	return routine.fn.apply(null, routine.args(req, (err, workbook) => {
		if (err)
			return res.status(500).send(ServerError())

		const buffer = XLSX.write(workbook, {type: 'buffer'})

		res.set('Content-disposition', `attachment; filename=${workbook.name}`)
		res.set('Content-type', XLSX_MIME)

		return res.send(buffer)
	}))
}
