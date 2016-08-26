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

exports.ElasticSearchError = WrappedError({
	type: 'http.error.elasticsearch',
	message: 'ElasticSearch server error ({status}): {origMessage}',
	status: 500
})
