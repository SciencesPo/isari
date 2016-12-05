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

const nestedFind = (enums, targetPath) => (value, doc) => {
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
