'use strict'

const promisify = require('native-promisify')
const { Client } = require('elasticsearch')
const config = require('config')
const { merge } = require('lodash')
const { ElasticSearchError } = require('./errors')

const client = module.exports = promisify(new Client(config.elasticsearch))


// Handy shortcuts

client.q = (type, queryParams, includeInfo = false) =>
	client.search({
		index: config.elasticsearch.index,
		type,
		body: { query: { query_string: queryParams } }
	})
	.then(res => res.hits.hits.map(({ _index, _type, _id, _score, _source }) => merge(includeInfo
		? { _index, _type, _id, _score }
		: {}, _source))
	)
	.catch(err => Promise.reject(ElasticSearchError(err)))
