'use strict'

const TypedError = require('error/typed')
const WrappedError = require('error/wrapped')


exports.ServerError = TypedError({
	type: 'http.error.server',
	message: 'Server error ({status}): {title}',
	title: null,
	status: 500
})

exports.ClientError = TypedError({
	type: 'http.error.client',
	message: 'Client error ({status}): {title}',
	title: null,
	status: 400
})

exports.NotFoundError = TypedError({
	type: 'http.error.client.notfound',
	title: null,
	message: 'Not Found: {title}',
	status: 404
})

exports.ElasticSearchError = WrappedError({
	type: 'http.error.elasticsearch',
	message: 'ElasticSearch server error ({status}): {origMessage}',
	status: 500
})

exports.UnauthorizedError = TypedError({
	type: 'http.error.client.unauthorized',
	titile: 'Authentication Required',
	message: 'Unauthorized: {title}',
	status: 401
})
