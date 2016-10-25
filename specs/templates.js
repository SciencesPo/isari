'use strict'

// Date parsing
const date = string => {
	const [ year, month, day ] = string.split('-')
	return { year, month, day }
}
const year = string => date(string).year

// People
const peopleName = p => `${p.firstname} ${p.name}`

// other objects name
const objectName = o => o.name

// oraganizationDates
function organizationDates(p){
	let label = p.organization.name
	if(p.startDate){
		label += " "+year(p.startDate)
	}
	if(p.endDate){
		label+=`-${year(p.endDate)}`
	}
	return label
}

// personnalActivities
function personalActivity(p){
	let label = p.personalActivityType
	if(p.startDate){
		label += " "+year(p.startDate)
	}
	if(p.endDate){
		label+=`-${year(p.endDate)}`
	}
	return label
}

// distinctions
const distinction = d => d.organizations.map(objectName).join(' & ') + (d.date ? " "+year(d.date) : "")

// oraganizationDates
function researchUnitCode(p){
	let label = p.code
	if(p.startDate){
		label += " "+year(p.startDate)
	}
	if(p.endDate){
		label += `-${year(p.endDate)}`
	}
	return label
}

// peopleDates
function peopleDates(p){
	let label = peopleName(p.people)
	if(p.startDate){
		label += " "+year(p.startDate)
	}
	if(p.endDate){
		label+=`-${year(p.endDate)}`
	}
	return label
}

exports.peopleName = peopleName
exports.objectName = objectName
exports.organizationDates = organizationDates
exports.distinction = distinction
exports.personalActivity = personalActivity
exports.researchUnitCode = researchUnitCode
exports.peopleDates = peopleDates