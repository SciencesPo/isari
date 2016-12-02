'use strict'

const enums = require('../../specs/enums.json')
const nested = require('../../specs/enums.nested.json')
const { map, filter, identity } = require('lodash/fp')
const debug = require('debug')('isari:enums')

const extractValue = map('value')
const removeEmpty = filter(identity)

exports.enumValueGetter = (zenum, path) => {
	if (Array.isArray(zenum)) {
		// As an array: direct values not exported into enums module
		return checkValueInList(getEnumValues(zenum))
	} else if (typeof zenum === 'string') {
		if (zenum.indexOf(':') === -1) {
			// Standard enum from enums.json
			if (enums[zenum]) {
				return checkValueInList(getEnumValues(enums[zenum]))
			} else {
				throw Error(`Invalid enum "${zenum}", check your schema and/or enums.json`)
			}
		} else {
			// Nested enum
			const [enumName, objectPath] = zenum.split(':')
			if (nested[enumName]) {
				debug('TODO handle nested enums validation', zenum)
				return () => true
			} else {
				throw Error(`Invalid nested enum "${enumName}" (from "${zenum}"), check your schema and/or enums.nested.json`)
			}
		}
	} else if (zenum) {
		throw Error(`Invalid enum type "${typeof zenum}"`)
	}
}

const checkValueInList = values => value => values.includes(value)

const getEnumValues = values => {
	if (Array.isArray(values) && typeof values[0] === 'object') {
		// Array of object, grab 'value' field
		return removeEmpty(extractValue(values))
	} else {
		// Array of string or object, keep as-is
		return values
	}
}
