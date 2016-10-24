'use strict'

// Exemple template string
exports.people = p => `${p.firstname} ${p.name}`

// Exemple simple champ
exports.activity = a => a.name

// Exemple complexe
exports.date = ({ year, month, day }) => day ? `${day}/${month}/${year}` : month ? `${month}/${year}` : `${year}`
