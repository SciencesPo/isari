'use strict'

const TypedError = require('error/typed')
const WrappedError = require('error/wrapped')
const { merge } = require('lodash/fp')


exports.ServerError = TypedError({
	type: 'http.error.server',
	message: 'Server error ({status}): {title}',
	title: null,
	status: 500
})

const ClientError = exports.ClientError = TypedError({
	type: 'http.error.client',
	message: 'Client error ({status}): {title}',
	title: null,
	status: 400
})

exports.NotFoundError = TypedError(merge(ClientError, {
	message: 'Not Found: {title}',
	status: 404
}))

exports.ElasticSearchError = WrappedError({
	type: 'http.error.elasticsearch',
	message: 'ElasticSearch server error ({status}): {origMessage}',
	status: 500
})
