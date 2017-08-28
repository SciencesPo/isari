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
		mongoQuery.item = itemId


	EditLog.find(mongoQuery)
	// skip and limit
	.skip(query.skip ? +query.skip : 0)
	.limit(query.limit ? +query.limit : 50).then(data => {
		const edits = []
		data.forEach(d => {
			const edit = {}
			edit.who = d.who
			edit.date = d.date
			edit.item = d.item
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
				edit.diff = d.data
			}

			edits.push(edit)
		})		


		return res.status(200).send(edits)
	})
	

}

function formatEditLogs(editLogs){
	

}