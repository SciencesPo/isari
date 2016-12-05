'use strict'

const debug = require('debug')('isari:http-errors')

exports.notFound = (req, res, next) => {
	const err = new Error('Not Found')
	err.status = 404
	next(err)
}

exports.serverError = includeErrInfo => (err, req, res, next) => { // eslint-disable-line no-unused-vars
	debug(err)
	res.status(err.status || 500).send({
		message: err.message,
		type: err.type,
		stack: includeErrInfo ? err.stack : undefined,
		error: includeErrInfo ? err : null
	})
}
