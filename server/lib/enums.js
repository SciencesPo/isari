'use strict'

const enums = require('../../specs/enums.json')
const nested = require('../../specs/enums.nested.json')

exports.enumValueGetter = (zenum) => {
	if (Array.isArray(zenum)) {
		// As an array: direct values not exported into enums module
		return simpleFind(zenum)
	} else if (typeof zenum === 'string') {
		if (zenum.indexOf(':') === -1) {
			// Standard enum from enums.json
			if (enums[zenum]) {
				return simpleFind(enums[zenum])
			} else {
				throw Error(`Invalid enum "${zenum}", check your schema and/or enums.json`)
			}
		} else {
			// Nested enum
			const [enumName, targetPath] = zenum.split(':')
			if (nested[enumName]) {
				return nestedFind(nested[enumName], targetPath)
			} else {
				throw Error(`Invalid nested enum "${enumName}" (from "${zenum}"), check your schema and/or enums.nested.json`)
			}
		}
	} else if (zenum) {
		throw Error(`Invalid enum type "${typeof zenum}"`)
	}
}

const simpleFind = enums => value => enums && enums.find && enums.find(e => e && (e === value || e.value === value))

const nestedFind = (enums, targetPath) => {
	// Paths are made for client, which understands them layer by layer:
	// - One ".." to get from field to object (we can always skip this one)
	// - One ".." to get from object to array of object (we can skip this one too)
	// - Next ".." to really get to parent object
	// object.parent() will get to the parent object directly, which means:
	// - First ".." can always be skipped
	// - Second ".." can be skipped only when we have an array of children
	// Right now, we'll just replace every "../../.." by ".." as we don't have any other case than
	// { parentField: ..., children: [ { childField: { enum: "../../../parentField" } } ] }
	targetPath = targetPath.replace(/^\.\.\//, '') // Remove first '..'
	targetPath = targetPath.replace(/\.\.\/\.\./g, '..') // Remove every double '..' (refering to array of children)
	return (value, doc) => {
		const targetValue = targetPath.split('/').reduce((d, p) => {
			if (p === '.') {
				return d
			} else if (p === '..') {
				return d.parent()
			} else {
				return d[p]
			}
		}, doc)
		return simpleFind(enums[targetValue])(value)
	}
}
