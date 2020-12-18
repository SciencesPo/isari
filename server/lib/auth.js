'use strict'

const config = require('config')
const { connect, search, bind, unbind } = require('./ldap')
const { People } = require('./model')
const debug = require('debug')('isari:ldap')


if (config.ldap.skip == "true") {
        module.exports = magicAuth()
} else {
        module.exports = connectedAuth
}


function magicAuth () {
        console.log('Beware : skipping LDAP auth because config.ldap.skip is set to "true"')
        return login => Promise.resolve(login).then(ldapUidToPeople)
}


function connectedAuth(login, password) {
	return connect()
	// authenticate
	.then(bind(config.ldap.bind_dn, config.ldap.password))
	// Search for user
	.then(search(config.ldap.dn, { scope: 'sub', filter: `(${config.ldap.loginAtt}=${login})` }))
	// Found user?
	.then((entries) => { 
		return entries.length === 0
		? Promise.reject(Error('LDAP User Not Found'))
		: entries.find(e => e[config.ldap.loginAtt] === login)}
	)
	// Is user active?
	.then(entry => { 
		return !Number(entry[config.ldap.activeFlag])
		? Promise.reject(Error('User Not Active'))
		: entry}
	)
	// Try to use user's password to bind a new client
	.then(entry => connect().then(bind(entry.dn, password)).then((c) => {c.destroy(); debug('disconnected')}))
	// Then try to find associated People entry
	.then(() => ldapUidToPeople(login))
}

function ldapUidToPeople (ldapUid) {
	return People.findOne({ ldapUid }).then(found => found || Promise.reject(Error('People Not Found')))
}
