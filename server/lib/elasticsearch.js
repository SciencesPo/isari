'use strict'

const promisify = require('native-promisify')
const { Client } = require('elasticsearch')
const config = require('config')
const { merge } = require('lodash')
const { ElasticSearchError } = require('./errors')
const debug = require('debug')('isari:search')


const client = module.exports = promisify(new Client(config.elasticsearch))


// Handy shortcuts

client.q = ({ type, query, size = config.elasticsearch.defaultSize, includeInfo = false }) => {
	const body = { query, size }
	const options = {
		index: config.elasticsearch.index,
		type,
		body
	}
	debug('ElasticSearch', options.index, options.type, JSON.stringify(options.body))

	return client.search(options)
		.then(res => res.hits.hits.map(({ _index, _type, _id, _score, _source }) => merge(includeInfo
			? { _index, _type, _id, _score }
			: { _id }, _source))
		)
		.catch(err => Promise.reject(ElasticSearchError(Error(err))))
}

// Query builder for auto-complete
client.q.forSuggestions = ({ type, query, size = config.elasticsearch.defaultSize, fields = [], includeInfo = false }) => {
	// query =
	// // Extract terms from query string
	// // TODO support complex queries with quotes 'n co
	// query.split(/\s+/)
	// .map(s => s.trim())
	// .filter(s => s.length > 0)
	// // Duplicate each term to create a query based on prefixes + fuzzy matching
	// .reduce((terms, term) => term.match(/(\*|\~.+?)$/)
	// 	? terms.concat([term]) // already an advanced term, don't modify
	// 	: terms.concat([term + '*', term + '~']) // prefix + fuzzy
	// , [])
	// // Re-build query
	// .join(' OR ')

	return client.q({ type, query: { query_string: { query, fields, fuzziness: 'AUTO' } }, size, includeInfo })
}

client.q.top = ({ type, field, size = config.elasticsearch.defaultSize, includeInfo = false }) => {
	const index = config.elasticsearch.index
	const body = {
		size: 0,
		aggs: { topx: { terms: { field, size } } }
	}
	debug('ElasticSearch (aggregation)', index, type, JSON.stringify(body))

	return client.search({ index, type, body })
		.then(res => res.aggregations.topx)
		.then(info => {
			const result = { hits: info.buckets.map(o => o.key) }
			if (includeInfo) {
				result._info = info
			}
			return result
		})
}
