'use strict'

const app = require('../app')
const request = require('supertest-as-promised')(Promise)


module.exports = { query, agent }


function agent (jar = {}) {
	return (method, url, data, headers = {}) =>
		query(method, url, data, Object.assign({}, headers, jar)).then(res => {
			// Save the cookie to use it later to retrieve the session
			const cookies = res.headers['set-cookie']
			if (cookies && cookies.length > 0) {
				jar.Cookie = cookies
			}
			return res
		})
}

function query (method, url, data, headers = {}) {
	let req = request(app)[method](url)
	if (headers) {
		Object.keys(headers).forEach(header => req.set(header, headers[header]))
	}
	if (data) {
		req = req.send(data)
	}
	return req.then(res => {
		if (String(res.status)[0] !== '2' && res.status !== 301 && res.status !== 302) {
			const error = new Error(`[${res.status}] ${res.text}`)
			error.statusCode = res.status
			throw error
		} else {
			return res
		}
	})
}
