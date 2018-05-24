#!/usr/bin/env node

const path = require('path')
process.chdir(path.join(__dirname, '..', '..', 'server'))

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
		// get people id lists from editLogs whoID 
		EditLog.aggregate([{$match:{whoID:{$ne:null}}},
			{'$group': {'_id':'$whoID'}},
			{'$lookup':{
				from: 'people',
			    localField: '_id',
				foreignField: '_id',
				as: 'editor'}},
			{'$project':{_id:1,
				name : '$editor.name',
				firstName: '$editor.firstName',
				roles: '$editor.isariAuthorizedCenters'
			}}
			]).then(data => {
			console.log(data)
			console.log(`found ${data.length} edit objects with whoID`)
			return next(null, data)
		})
	},
	(data,next) => {
		
		//update editlogs
		async.parallelLimit(
			data.map(e => (nextParallel) => {

				return EditLog.updateMany({whoID: e._id},
				{who: { id: e._id,
				     name: (e.firstName[0]? e.firstName[0] + ' ' : '')+e.name[0],
				     roles: e.roles[0] ?
							e.roles[0].map(iac =>({lab:iac.organization,role:iac.isariRole})):
							[]
				 }},
				(error,nb_affected) => {
					nextParallel(null, nb_affected.n)})
			}),
			100,
			(err, counts) => {
				console.log(`wrote ${_.sum(counts)} modifications on editLogs`)
				return next(null, counts)
			})
	}
],error => {
	if (error){
		console.log(error)
		process.exit(1);
	}
	process.exit(0);
})

