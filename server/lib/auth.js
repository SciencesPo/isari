// 'use strict'

// const config = require('config')
// const { connect, search, bind, unbind } = require('./ldap')

<<<<<<< HEAD
// const baseClient = connect()

// module.exports = (login, password) => baseClient
// 	// Search for user
// 	.then(search(config.ldap.dn, { scope: 'sub', filter: `(uid=${login})` }))
// 	// Found user?
// 	.then(entries => entries.length === 0
// 		? Promise.reject(Error('User Not Found'))
// 		: entries.find(e => e.uid === login)
// 	)
// 	// Is user active?
// 	.then(entry => !Number(entry[config.ldap.activeFlag])
// 		? Promise.reject(Error('User Not Active'))
// 		: entry
// 	)
// 	// Try to use user's password to bind a new client
// 	.then(entry => connect().then(bind(entry.dn, password)).then(unbind))
=======

module.exports = config.ldap.skip ? magicAuth() : connectedAuth()


function magicAuth () {
	return () => Promise.resolve()
}

function connectedAuth () {
	const baseClient = connect()

	return (login, password) => baseClient
		// Search for user
		.then(search(config.ldap.dn, { scope: 'sub', filter: `(uid=${login})` }))
		// Found user?
		.then(entries => entries.length === 0
			? Promise.reject(Error('User Not Found'))
			: entries.find(e => e.uid === login)
		)
		// Is user active?
		.then(entry => !Number(entry[config.ldap.activeFlag])
			? Promise.reject(Error('User Not Active'))
			: entry
		)
		// Try to use user's password to bind a new client
		.then(entry => connect().then(bind(entry.dn, password)).then(unbind))
}
>>>>>>> f3d07542792cbca46bc5bb89d97d57541a8f852d
