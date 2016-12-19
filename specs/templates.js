'use strict'

const { formatEnum } = require('../server/lib/enums')

// Date parsing
const date = string => {
	const [ year, month, day ] = string.split('-')
	return { year, month, day }
}
const year = string => date(string).year

// People
const peopleName = p => {
	let label = p.name
	if (p.firstName) {
		label = p.firstName + ' ' + label
	}
	return label
}

// other objects name
const objectName = o => o.name

// oraganizationDates
function organizationDates(p){
	if (!p.organization) {
		return ''
	}
	let label = p.organization.acronym ? p.organization.acronym : p.organization.name
	if(p.startDate){
		label += " "+year(p.startDate)
	}
	if(p.endDate){
		label+=`-${year(p.endDate)}`
	}
	return label
}

// personnalActivities
function personalActivity(p) {
	return formatEnum('personalActivityTypes', p.personalActivityType, label => {
		if (p.startDate && p.endDate) {
			label += ' ' + year(p.startDate) + '-' + year(p.endDate)
		} else if (p.startDate) {
			label += ' ' + year(p.startDate) + '-…'
		} else if (p.endDate) {
			label += ' …-' + year(p.endDate)
		}
		return label
	})
}

// distinctions
const distinction = d => d.title

// oraganizationDates
function researchUnitCode(p){
	let label = p.code
	if(p.startDate || p.enDate)
		label+=" ("
	if(p.startDate){
		label += year(p.startDate)
	}
	if(p.endDate){
		label += `-${year(p.endDate)}`
	}
	else{
		if(p.starDate)
			label += "..."
	}
	if(p.startDate || p.enDate)
		label+=")"
	return label
}

// peopleDates
function peopleDates(p){
	let label = p.people ? peopleName(p.people) : ''
	if(p.startDate){
		label += " "+year(p.startDate)
	}
	if(p.endDate){
		label+=`-${year(p.endDate)}`
	}
	return label
}

function prefixDates(label,g){
	if (g.startDate && g.endDate) {
			label += ' ' + year(g.startDate) + '-' + year(g.endDate)
	} else if (g.startDate) {
		label += ' ' + year(g.startDate) + '-…'
	} else if (g.endDate) {
		label += ' …-' + year(g.endDate)
	}
	return label
}

// grades
function peopleGrades(g){
	
	return formatEnum('gradeStatus', g.gradeStatus,label => {return prefixDates(label,g)})
}

exports.peopleName = peopleName
exports.objectName = objectName
exports.organizationDates = organizationDates
exports.distinction = distinction
exports.personalActivity = personalActivity
exports.researchUnitCode = researchUnitCode
exports.peopleDates = peopleDates
exports.peopleGrades = peopleGrades
