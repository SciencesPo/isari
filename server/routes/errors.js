'use strict'

exports.notFound = (req, res, next) => {
	const err = new Error('Not Found')
	err.status = 404
	next(err)
}

exports.serverError = includeErrInfo => (err, req, res) => {
	res.status(err.status || 500).send({
		message: err.message,
		type: err.type,
		stack: includeErrInfo ? err.stack : undefined,
		error: includeErrInfo ? err : null
	})
}
