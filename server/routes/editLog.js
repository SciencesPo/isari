'use strict'

const { Router } = require('express')
const { UnauthorizedError } = require('../lib/errors')
const models = require('../lib/model')
const {EditLog} = require('../lib/edit-logs')

const { requiresAuthentication, scopeOrganizationMiddleware } = require('../lib/permissions')

const async = require('async'),
      moment = require('moment'),
      mongoose = require('mongoose'),
      _ = require('lodash');

const debug = require('debug')('isari:export');

const ObjectId = mongoose.Types.ObjectId;

// UTILS

function formatKind(kind){
	if (kind === "E")
		return "update"
	if (kind === "D")
		return "delete"
	if (kind === "N")
		return "create"
	//by default fall back to update
	return "update"
}


module.exports = Router().get('/:model/:itemId?', requiresAuthentication, getEditLog)

function getEditLog(req, res){
	let model = req.params.model
	// params
	const itemId = req.params.itemId
	const query = req.query

	// User has to be central admin to access editLog list feature
	if (!itemId && req.userCentralRole !== 'admin'){
		res.send(UnauthorizedError({ title: 'EditLog is restricted to central admin users'}))
	}

	// User has to have write access on an object to access its editlog
	if(
		(model === 'people' && itemId && !req.userCanEditPeople(itemId)) ||
	 	(model === 'activity' && itemId && !req.userCanEditActivity(itemId)) ||
	 	(model === 'organization' && itemId && !req.userCanEditOrganization(itemId))
	  ){
		res.send(UnauthorizedError({ title: 'Write access is mandatory to access EditLog'}))
	}

	// build the mongo query to editLog collection
	model = _.capitalize(model)
	const mongoQuery = {model}
	if (itemId)
		mongoQuery.item = ObjectId(itemId)
	console.log(query.path)
	if (query.path)
		mongoQuery['diff'] = {'$elemMatch': {"0.path":query.path}} 
	if (query.action)
		mongoQuery['action'] = query.action


	EditLog.aggregate([
		{'$match':mongoQuery},
		{'$lookup':{
	          from: "people",
	          localField: "whoID",
	          foreignField: "_id",
	          as: "creator"
        }},
        // {'$lookup':{
	       //    from: "organizations",
	       //    localField: "creator.isariAuthorizedCenters.organization",
	       //    foreignField: "_id",
	       //    as: "isariLabs"
        // }},
        {'$lookup':{
	          from: model === 'People' ? 'people' : (model === 'Organization' ? 'organizations' : 'activities'),
	          localField: "item",
	          foreignField: "_id",
	          as: "itemObject"
        }},
        // TODO : project to only usefull fields to limit payload
        // {'$project':{
        // 	whoID:1,
        // 	"creator.firstName":1,
        // 	"creator.name":1,
        // 	"creator.isariAuthorizedCenters":1,

        // }}
		// skip and limit
		{'$skip':query.skip ? +query.skip : 0},
		{'$limit':query.limit ? +query.limit : 100}

		])
		.then(data => {
		const edits = []
		data.forEach(d => {
			const edit = {}
			edit.who = {
				id: d.whoID,
				name: (d.creator[0].firstName ? d.creator[0].firstName+' ': '')+ d.creator[0].name,
				roles: d.creator[0].isariAuthorizedCenters ? 
						d.creator[0].isariAuthorizedCenters.map(iac =>({lab:iac.organization,role:iac.isariRole})):
						[]
			}

			edit.date = d.date
			edit.item = { id:d.item}
			if (model === "People" && d.itemObject[0])
				edit.item.name = (d.itemObject[0].firstName ? d.itemObject[0].firstName+' ': '')+ d.itemObject[0].name
			else
				if (d.itemObject[0])
					edit.item.name = d.itemObject[0].acronym || d.itemObject[0].name

			edit.action = d.action

			if (edit.action === 'update'){
				
				edit.diff = d.diff.filter(d => d[0].path[0] !== 'latestChangeBy')
							.map(d => {
								d = d[0]
								if (d.path.includes("id"))
									return undefined
								const diff = {path: d.path.filter(e => typeof e !== 'number')}

								if (d.kind === 'A'){
									//array case...
									if (d.item.lhs)
										diff.valueBefore = d.item.lhs
									if(d.item.rhs)
										diff.valueAfter = d.item.rhs
									diff.editType = formatKind(d.item.kind)
								}
								else {
									if (d.lhs)
										diff.valueBefore = d.lhs
									if( d.rhs)
										diff.valueAfter = d.rhs
									diff.editType = formatKind(d.kind)
								}
								return diff
							}).filter(d => d)
			}
			else{
				// that's actually a bad idea, performance-wise.
				// This data contain the whole document !
				edit.diff = {}
				if (edit.action === "create"){
					edit.diff.valueAfter = d.data
					edit.diff.editType = 'create'
				}
				if (edit.action === "delete"){
					edit.diff.valueBefore = d.data
					edit.diff.editType = 'delete'
				}
			}

			edits.push(edit)
		})		


		return res.status(200).send(edits)
	})
	

}

function formatEditLogs(editLogs){
	

}