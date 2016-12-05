'use strict'

module.exports = function removeEmptyFields (object) {
	// Ignore any scalar value
	if (typeof object !== 'object') {
		return object
	}

	// Handle arrays of values
	if (Array.isArray(object)) {
		return object.map(removeEmptyFields).filter(v => !isEmpty(v))
	}

	// Only cleanup literal objects, don't mess with class instances
	if (object.constructor !== Object) {
		return object
	}

	// We have a literal object, map over its keys
	return Object.keys(object).reduce((result, field) => {
		const value = removeEmptyFields(object[field])
		if (!isEmpty(value)) {
			result[field] = value
		}
		return result
	}, {})
}

// Check if a value is "empty" (string, array, object…)
function isEmpty (value) {
	return (
		// Empty scalar values
		value === '' || value === undefined || value === null || (
			// Object values
			typeof value === 'object' && (
				// Empty object
				Object.keys(value).length === 0 ||
				// Empty array
				(Array.isArray(value) && value.length === 0)
			)
		)
	)
}
