'use strict'

const config = require('config')
const { createClient } = require('ldapjs')
const debug = require('debug')('isari:ldap')


const connect = (url = config.ldap.url) =>
	Promise.resolve().then(() => {
		debug('connecting')
		const ldapClient = createClient({ url,  reconnect: true, timeout: 2000, connectTimeout:2000 })
		ldapClient.on('error', err => {
  			debug('LDAP connection failed', err)
  			throw err
		})
		return ldapClient
	})


const bind = (dn, password) => client =>{
	debug(`binding ${dn}`)
	return new Promise((resolve, reject) => client.bind(dn, password, err => err ? reject(err) : resolve(client)))
}

const unbind = client => new Promise((resolve, reject) => client.unbind(err => err ? reject(err) : resolve()))

const search = (dn, opts) => client => new Promise((resolve, reject) =>{
	debug(`searching ${dn}`)
	return client.search(dn, opts, (err, res) => {
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
			client.unbind(e => {
				client.destroy()
				debug("disconnected")
			}) 
			if (!rejected) {
				resolve(entries)
			}
		})
	})})


module.exports = {
	connect,
	bind,
	unbind,
	search
}
