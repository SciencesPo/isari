const models = require('../../server/lib/model')
const {EditLog} = require('../../server/lib/edit-logs')
const async = require('async')
const _ = require('lodash')

const mongoose = require('../../server/node_modules/mongoose')
const ObjectId = mongoose.Types.ObjectId;

console.log('starting migration')
models.connect()

async.waterfall([
	next => {
		// get mongoid ldapuid index
		models.People.aggregate([{$match:{ldapUid:{$ne:null}}},{$project:{_id:1, ldapUid:1}}]).then(data => {
			console.log(data.length)
			return next(null, data)
	})
	},
	(data,next) => {
		// update edtilogs
		async.parallelLimit(
			data.map(e => (nextParallel) => {

				return EditLog.updateMany(
				{who: e.ldapUid},
				{whoID: ObjectId(e._id)},
				(error,cursor) => nextParallel(null, cursor.modifiedCount))
			}),
			100,
			(err, counts) => {
				console.log(`wrote ${_.sum(counts)} modifications on editLogs`)
				return next(null, data)
			})
	},
	(data,next) => {
		// update edtilogs
		async.parallelLimit(
			data.map(e => (nextParallel) => models.People.updateMany(
				{latestChangeBy:e.ldapUid},
				{latestChangeBy: ObjectId(e._id)},
				(error,cursor) => nextParallel(null, cursor.modifiedCount))),
			100,
			(err, counts) => {
				console.log(`wrote ${_.sum(counts)} modifications on People`)
				return next(null, data)
			})
	},
	(data,next) => {
		// update edtilogs
		async.parallelLimit(
			data.map(e => (nextParallel) => models.Organization.updateMany(
				{latestChangeBy:e.ldapUid},
				{latestChangeBy: ObjectId(e._id)},
				(error,cursor) => nextParallel(null, cursor.modifiedCount))),
			100,
			(err, counts) => {
				console.log(`wrote ${_.sum(counts)} modifications on People`)
				return next(null, data)
			})
	},
	(data,next) => {
		// update edtilogs
		async.parallelLimit(
			data.map(e => (nextParallel) => models.Activity.updateMany(
				{latestChangeBy:e.ldapUid},
				{latestChangeBy: ObjectId(e._id)},
				(error,cursor) => nextParallel(null, cursor.modifiedCount))),
			100,
			(err, counts) => {
				console.log(`wrote ${_.sum(counts)} modifications on Activity`)
				return next(null)
			})
	}
],error => {
	if (error){
		console.log(error)
		process.exit(1);
	}
	process.exit(0);
})

