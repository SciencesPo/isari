'use strict'

exports.notFound = (req, res, next) => {
	const err = new Error('Not Found')
	err.status = 404
	next(err)
}

exports.serverError = includeErrInfo => (err, req, res, next) => { // eslint-disable-line no-unused-vars
	res.status(err.status || 500).send({
		message: err.message,
		type: err.type,
		stack: includeErrInfo ? err.stack : undefined,
		error: includeErrInfo ? err : null
	})

	// Weird behaviors in test environment cuts the long error messages and gives invalid JSON
	if (process.env.NODE_ENV !== 'test') {
		next(err)
	}
}
