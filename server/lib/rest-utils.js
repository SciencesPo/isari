'use strict'

exports.restHandler = fn => (req, res, next) => {
	fn(req, res).then(data => res.send(data)).catch(err => {
		if (!err.status) {
			err.status = 500
		}
		next(err)
	})
}
