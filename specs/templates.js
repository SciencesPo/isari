'use strict'

// People
const peopleName = p => `${p.firstname} ${p.name}`

// other objects name
const objectName = o => o.name

// oraganizationDates
function organizationDates(p){
	let label = p.organization.name
	if(p.startDate){
		label += " "+p.startDate.year
	}
	if(p.endDate){
		label+=`-${p.endDate.year}`
	}
	return label
}

// personnalActivities
function personalActivity(p){
	let label = p.personalActivityType
	if(p.startDate){
		label += " "+p.startDate.year
	}
	if(p.endDate){
		label+=`-${p.endDate.year}`
	}
	return label
}

// distinctions
const distinction = d => d.organization.name + (d.date ? " "+d.date.year : "")

// oraganizationDates
function researchUnitCode(p){
	let label = p.code
	if(p.startDate){
		label += " "+p.startDate.year
	}
	if(p.endDate){
		label += `-${p.endDate.year}`
	}
	return label
}

// peopleDates
function peopleDates(p){
	let label = peopleName(p.people)
	if(p.startDate){
		label += " "+p.startDate.year
	}
	if(p.endDate){
		label+=`-${p.endDate.year}`
	}
	return label
}

// Exemple complexe
// exports.date = ({ year, month, day }) => day ? `${day}/${month}/${year}` : month ? `${month}/${year}` : `${year}`

exports.peopleName = peopleName
exports.objectName = objectName
exports.organizationDates = organizationDates
exports.distinction = distinction
exports.personalActivity = personalActivity
exports.researchUnitCode = researchUnitCode
exports.peopleDates = peopleDates