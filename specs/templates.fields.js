'use strict'

//****** utils
const { formatEnum } = require('../server/lib/enums')
const moment = require('../server/node_modules/moment')
const _ = require('../server/node_modules/lodash')
const { overlap, formatDate } = require('../server/export/helpers')

// datesPeriod

function prettyPrintTimePeriod(g){
  if (g.startDate && g.endDate) {
      if (year(g.endDate) != year(g.startDate))
        return year(g.startDate) + '-' + year(g.endDate)
      else
        return year(g.startDate)
  } else if (g.startDate) {
    return  year(g.startDate) + '-…'
  } else if (g.endDate) {
    return ' …-' + year(g.endDate)
  }
  return ''
}

// period from scope
function testingPeriodFrom(scope){
  let startDate
  let endDate
  if (scope.query.start || scope.query.end) {
    startDate = scope.query.start ? scope.query.start : scope.query.end
    endDate = scope.query.end ? scope.query.end : scope.query.start 
  }
  else{
    // no scope, take everything
    startDate = '0000-00-00'
    endDate = '9999-12-31'
  }


  if (startDate > endDate){
    const swap = endDate
    endDate = startDate
    startDate = swap 
  }
  return { endDate, startDate }
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
    label += ' '+prettyPrintTimePeriod(p)
    return label
  }

  if (Array.isArray(ps))
    return ps.map(p => formatPosition(p)).join(";")
  else
    return formatPosition(p)  
}

function memberships(afs,scope){
  if (!afs)
    return '';

  const r = _.sortBy(
    // remove lab aff when visiting or associate only if scope set to one lab
    afs.filter(a => !scope.userScopeOrganizationId || (a.membershipType !== 'visiting' && a.membershipType !== 'associé'))
        // keep only memberships active this month
       .filter(a => overlap(a, testingPeriodFrom(scope)))
    ,
    // sort orga from scope first and then by alphabetic order
    [a => a.organization._id.toString() === scope.userScopeOrganizationId ? 'AAAAAAAAA' : (a.organization.acronym || a.organization.name)] 
  )
  
  if (r.length)
      return _.uniq(r.map(af => af.organization.acronym || af.organization.name));
  
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

function currentDeptMembershipsDates(p,scope){
  if (p){
    const thisMonth = moment().format('YYYY-MM')
    // keep only memberships active this month
      const afs = p.filter(a => overlap(a,testingPeriodFrom(scope)))
            // sort orga from scope first and then by alphabetic order 
            .sort(e => e.departement)
    if (afs.length){
      // take the last one
      return afs.map(af => formatEnum('teachingDepartements', af.departement));
    }
  }
    return '';
  }


// personnalActivities
function personalActivity(p) {

  if (!Array.isArray(p))
    p = [p]

  return p.map(e => {
    if (e)
     return formatEnum('personalActivityTypes', e.personalActivityType, label => label + ' ' + prettyPrintTimePeriod(p))
    }
    ).join(';')
}

// distinctions
const distinction = d => d.filter(e => e).map(e => e.title).join(';')

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
    if(p.startDate)
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
  return g.map(e => formatEnum('gradeStatus', e.gradeStatus, label => {return label + ' '+ prettyPrintTimePeriod(e)})).join(";") 
}

//Bonus
exports.bonuses = bonuses => {
  if (bonuses.length)
    return bonuses.map(b => formatEnum('bonusTypes', b.bonusType, label => {return label + ' '+ prettyPrintTimePeriod(b)}))
  else
    return []
}

exports.isariAuthorizedCenters = (as,scope) => {
  const l = as.map(a => formatEnum('isariRoles',a.isariRole, label => {
    if (!a.organization || a.organization._id.toString() === scope.userScopeOrganizationId )
      return label
    else
      return label + ' ' + (a.organization.acronym || a.organization.name)
  }))
  return l
}

exports.grant = (gs)=>{
  let r = gs.filter(g => g.grantType).map(g => formatEnum('grantTypes', g.grantType))
  if (!r.length)
    r = gs.filter(g => g.organization).map(g => g.organization.acronym || g.organization.name)
  return r;
}

exports.facultyMonitoring = (fm, scope)=>{

  if (fm.length){
    return fm.map(f => {
      return {
        startDate: f.date, 
        endDate: f.endDate ? f.endDate : f.date,
        facultyMonitoringType: f.facultyMonitoringType }
    })
    .filter(a => overlap(a,testingPeriodFrom(scope)))
    .map(a => {
      return formatEnum('facultyMonitoringTypes', a.facultyMonitoringType, label => `${label} ${prettyPrintTimePeriod(a)}`)
    })
  }

  return '';
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
exports.memberships = memberships

// exports utility function to be shared with columns.virtual.js
exports.testingPeriodFrom = testingPeriodFrom
