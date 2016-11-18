'use strict'

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
	if (p.gender === 'm') {
		label = 'M. ' + label
	} else if (p.gender === 'f') {
		label = 'Mme ' + label
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

exports.peopleName = peopleName
exports.objectName = objectName
exports.organizationDates = organizationDates
exports.distinction = distinction
exports.personalActivity = personalActivity
exports.researchUnitCode = researchUnitCode
exports.peopleDates = peopleDates
