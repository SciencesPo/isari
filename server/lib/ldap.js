'use strict'

const config = require('config')
const { createClient } = require('ldapjs')


const connect = (url = config.ldap.url) =>
	Promise.resolve().then(() => createClient({ url }))

const bind = (dn, password) => client =>
	new Promise((resolve, reject) => client.bind(dn, password, err => err ? reject(err) : resolve(client)))

const unbind = client => new Promise((resolve, reject) => client.unbind(err => err ? reject(err) : resolve()))

const search = (dn, opts) => client => new Promise((resolve, reject) =>
	client.search(dn, opts, (err, res) => {
		if (err) {
			return reject(err)
		}

		let entries = []
		let rejected = false
		res.on('error', err => {
			rejected = true
			reject(err)
		})
		res.on('searchEntry', entry => {
			if (!rejected) {
				entries.push(entry.object)
			}
		})
		res.on('end', () => {
			if (!rejected) {
				resolve(entries)
			}
		})
	}))


module.exports = {
	connect,
	bind,
	unbind,
	search
}
