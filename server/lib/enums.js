'use strict'

const enums = require('../../specs/enums.json')
const nestedEnums = require('../../specs/enums.nested.json')
const countries = require('../../specs/enum.countries.json')
const currencies = require('../../specs/enum.currencies.json')
const languages = require('../../specs/enum.languages.json')
const memoize = require('memoizee')


exports.enumValueGetter = (description /*: { label, value }[] | string */) => {
	// As an array: direct values not exported into enums module
	if (Array.isArray(description)) {
		return simpleFind(description)
	}
	// Name of simple enum
	else if (typeof description === 'string' && description.indexOf(':') === -1) {
		const values = getSimpleEnumValues(description)
		if (values) {
			return simpleFind(values)
		} else {
			throw Error(`Invalid enum "${description}", check your schema and/or enums.json`)
		}
	}
	// Description of nested enum, format 'name:path'
	else if (typeof description === 'string') {
		const [name, path] = description.split(':')
		const values = getNestedEnumValues(name)
		if (values) {
			return nestedFind(values, path)
		} else {
			throw Error(`Invalid nested enum "${name}" (from "${description}"), check your schema and/or enums.nested.json`)
		}
	}
	// Unrecognized enum description
	else if (description) {
		throw Error(`Invalid enum type "${typeof description}"`)
	}
}

const simpleFind = enums => value => {
	if (enums && enums.find) {
		return enums.find(e => e && (e === value || e.value === value))
	} else {
		return null
	}
}

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

const getNestedEnumValues = exports.getNestedEnumValues = name => {
	return nestedEnums[name] || null
}

const getSimpleEnumNames = exports.getSimpleEnumNames = memoize(() =>
	// enums.json
	Object.keys(enums)
	// Aliases
	.concat([
		'currencies', // iso4217
		'languages', // iso6391
	])
	.sort()
)

exports.getAllSimpleEnumValues = memoize(() =>
	getSimpleEnumNames()
	.reduce((o, name) => Object.assign(o, {[name]: getSimpleEnumValues(name)}), {})
)

const getSimpleEnumValues = exports.getSimpleEnumValues = memoize(name => {
	// Special cases: some enums are just keys in enums.json and must be matched with another file

	// nationalities
	if (name === 'nationalities') {
		return enums.nationalities.map(value => {
			const { nationalityLabel: label } = countries.find(c => c.alpha2 === value)
			return { value, label }
		})
	}

	// iso4217 === currencies
	if (name === 'currencies' || name === 'iso4217') {
		return enums.iso4217.map(value => {
			const { label, symbol } = currencies.find(c => c.code === value)
			return { value, label, symbol } // TODO use symbol?
		})
	}

	// iso6391 === languages
	if (name === 'languages' || name === 'iso6391') {
		return enums.iso6391.map(value => {
			const { label } = languages.find(c => c['639-1'] === value)
			return { value, label } // TODO use symbol?
		})
	}

	// countries
	if (name === 'countries') {
		return enums.countries.map(value => {
			const { countryLabel: label } = countries.find(c => c.alpha2 === value)
			return { value, label }
		})
	}

	// Other cases: no need to reformat
	return enums[name] || null
})

exports.formatEnum = (name, value, customize) => {
	let found
	if (Array.isArray(value))
		//nested enums
		found = simpleFind(getNestedEnumValues(name)[value[0]])(value[1])
	else
		found = simpleFind(getSimpleEnumValues(name))(value)


	if (found && customize && typeof found.label === 'object') {
		let labels = Object.assign({}, found.label)
		for (let lang in labels) {
			labels[lang] = customize(labels[lang], lang)
		}
		return Object.assign({}, found, { label: labels })
	} else if (found) {
		return found
	} else {
		return null
	}
}
