'use strict'

//****** utils
const { formatEnum } = require('../server/lib/enums')
const moment = require('../server/node_modules/moment')

// datesPeriod

function prettyPrintTimePeriod(g){
	if (g.startDate && g.endDate) {
			return year(g.startDate) + '-' + year(g.endDate)
	} else if (g.startDate) {
		return  year(g.startDate) + '-…'
	} else if (g.endDate) {
		return ' …-' + year(g.endDate)
	}
}


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
function organizationDates(ps){
	const formatPosition = p => {
		if (!p.organization) {
		return ''
		}
		let label = p.organization.acronym ? p.organization.acronym : p.organization.name
		label += prettyPrintTimePeriod(p)
		return label
	}

	if (Array.isArray(ps))
		return ps.map(p => formatPosition(p)).join(";")
	else
		return formatPosition(p)	
}

function currentOrganizationDates(afs,scope){
	if (!afs)
		return '';
	const thisMonth = moment().format('YYYY-MM') 
	// keep only memberships active this month
	const r = afs.filter(a => (!a.startDate || a.startDate <= thisMonth) && (!a.endDate || a.endDate >= thisMonth))
		// sort orga from scope first and then by alphabetic order 
		.sort(e => (e.organization._id.toString() === scope.organization) ? 'aaaaaaaaaa' : e.organization.acronym || e.organization.name)
	if (r.length){
	  	// take the last one
	  	return r.map(af => af.organization.acronym || af.organization.name).join(", ");
	}
	
	return '';

}


// department Memberships Dates
function deptMembershipsDates(p){
	if (!p.departement) {
		return ''
	}
	return formatEnum('teachingDepartements',p.departement,label =>{
		label += ' '+prettyPrintTimePeriod(p)
		return label
	}) 
}

function currentDeptMembershipsDates(p){
	if (p){
		const thisMonth = moment().format('YYYY-MM')
		// keep only memberships active this month
	  	const afs = p.filter(a => (!a.startDate || a.startDate <= thisMonth) && (!a.endDate || a.endDate >= thisMonth))
	  				// sort orga from scope first and then by alphabetic order 
	  				.sort(e => e.departement)
	  if (afs.length){
	  	// take the last one
	  	console.log(afs.map(af => formatEnum('teachingDepartements', af.departement)))
	  	return afs.map(af => formatEnum('teachingDepartements', af.departement));
	  }
	}
  	return '';
  }


// personnalActivities
function personalActivity(p) {
	if (!Array.isArray(p))
		p = [p]

	return p.map(e => formatEnum('personalActivityTypes', e.personalActivityType, label => label + ' ' + prettyPrintTimePeriod(p))).join(';')
}

// distinctions
const distinction = d => d.map(e => e.title).join(';')

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

// grades
function peopleGrades(g){
	if (!Array.isArray(g))
		g = [g]
	return g.map(e => formatEnum('gradeStatus', e.gradeStatus,label => {return label + ' '+ prettyPrintTimePeriod(e)})).join(";") 
}

exports.peopleName = peopleName
exports.objectName = objectName
exports.deptMembershipsDates = deptMembershipsDates
exports.currentDeptMembershipsDates = currentDeptMembershipsDates
exports.distinction = distinction
exports.personalActivity = personalActivity
exports.researchUnitCode = researchUnitCode
exports.peopleDates = peopleDates
exports.peopleGrades = peopleGrades
exports.organizationDates = organizationDates
exports.currentOrganizationDates = currentOrganizationDates
