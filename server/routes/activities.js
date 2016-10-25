'use strict'

const { restRouter } = require('../lib/rest-utils')
const { Activity } = require('../lib/model')
const { clone } = require('lodash/fp')


module.exports = restRouter(Activity, formatActivity, 'activity')


function formatActivity (activity) {
	let o = activity.toObject ? activity.toObject() : clone(activity)

	o.id = o._id

	delete o._id
	delete o.__v

	return o
}
