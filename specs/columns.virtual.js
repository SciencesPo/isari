'use strict'

//****** utils
const { formatEnum } = require('../server/lib/enums');
const moment = require('../server/node_modules/moment');
const _ = require('../server/node_modules/lodash');
const { overlap, formatDate } = require('../server/export/helpers');
const { testingPeriodFrom } = require('./templates.fields')

const selectPeriodFromScope = (periods, scope) => {	
	const scopePeriod = testingPeriodFrom(scope)
	// keep only periods active during scope or this month
    return _.sortBy(periods.filter(p => overlap(p,scopePeriod)), [p => p.endDate || p.startDate]).reverse()
}


exports.email = (people) => {
  if (!people.contacts)
    return '';

  const relevantContact = people.contacts.find(contact => !!contact.email);

  if (!relevantContact)
    return '';

  return relevantContact.email;
};

exports.membershipType = (people, scope) => {
  if (!people.academicMemberships)
    return '';

  let af = [];
  if (scope.userScopeOrganizationId)
  	af = people.academicMemberships.filter(e => e.organization._id.toString() === scope.userScopeOrganizationId);
  else
  	// central point of view let's check if the correct role is set
  	if (scope.userCentralRole)
  		af = people.academicMemberships.filter(e => e.organization.isariMonitored);

  af = af.sort(e => e.startDate)

  if (af.length){
  	// take the last one
  	af = af[af.length -1]
  	af = formatEnum('academicMembershipType', af.membershipType)
  	return af;
  }
  else
  	return '';
};


// grade

exports.gradeStatus = (people, scope) => {
	if (people.grades){
	  return selectPeriodFromScope(people.grades, scope).map(a => formatEnum('gradeStatus', a.gradeStatus))
	}

  return '';
};

exports.grade = (people, scope) => {
	if (people.grades){
		return selectPeriodFromScope(people.grades, scope).map(a => formatEnum('grade', [a.gradeStatus, a.grade]))
	}
  	return '';
};

exports.entryDate = (people, scope) => {
	if (people.academicMemberships)
		if (scope.userScopeOrganizationId)
	  		return _.min(people.academicMemberships.filter(e => e.organization._id.toString() === scope.userScopeOrganizationId).map(e => e.startDate))
  		else
  			// central point of view let's check if the correct role is set
  			if (scope.userCentralRole)
	  			return _.min(people.academicMemberships.filter(e => e.organization.isariMonitored).map(e => e.startDate))
  	return '';
};

exports.leavingDate = (people, scope) => {
	if (people.academicMemberships)
		if (scope.userScopeOrganizationId)
		  return _.maxBy(people.academicMemberships.filter(e => e.organization._id.toString() === scope.userScopeOrganizationId).map(e => e.endDate), d => d || Infinity )
		else
  			// central point of view let's check if the correct role is set
  			if (scope.userCentralRole)
	  			return _.maxBy(people.academicMemberships.filter(e => e.organization.isariMonitored).map(e => e.endDate), d => d || Infinity )
  	return '';
};


// positions 
exports.tutelle = (people, scope) => {
	if (people.positions)
		return _.uniq(selectPeriodFromScope(people.positions, scope).map(p => p.organization.acronym || p.name)).join(", ")
  	return '';
};

exports.jobName = (people, scope) => {
	if (people.positions)
		return selectPeriodFromScope(people.positions, scope).map(p => p.jobName).join(", ")
  	return '';
};

exports.jobType = (people, scope) => {
	if (people.positions)
		return selectPeriodFromScope(people.positions, scope).map(p => formatEnum('jobType', p.jobType))
  	return '';
};

exports.timepart = (people, scope) => {
	if (people.positions)
		return selectPeriodFromScope(people.positions, scope).map(p => p.timepart*100+'%').join(", ")
  	return '';
};

// distinctions

 exports.degree = (people) => {
	if (people.distinctions) {
		const order = {
			hdr: 1,
			doctorat: 2,
			master: 3,
			autre: 4
		}
		const ds = people.distinctions.filter( d => d.distinctionType !== 'distinction')
		const d = ds.sort(d => order[d.distinctionSubtype])[0]

		if (d)
			return d.distinctionSubtype !== 'autre' ? formatEnum('distinctionSubtypes',[d.distinctionType ,d.distinctionSubtype]) : d.title
	}
  	return '';
};


/// Activities

// people

const activityPeople = (activity, main = true) => {
	let peopleRoleFilter = {}
	if (main){
		peopleRoleFilter = {
			doctorat: ['doctorant(role)'],
			partenariat: ['responsableScientifique'],
			projetderecherche: ['PI'],
			mob_entrante: ['visiting'],
			hdr: ['doctorant(role)'],
			mob_sortante: ['visiting']
		};
	}
	else{
		peopleRoleFilter = {
			doctorat: ['directeur','codirecteur'],
			partenariat: ['referent','participant'],
			projetderecherche: ['responsableScientifique','membre'],
			mob_entrante: ['referent'],
			hdr: ['directeur','codirecteur'],
			mob_sortante: ['referent']
		};
	}

	if (activity.people){
		if (peopleRoleFilter[activity.activityType])
			return activity.people.filter(p => peopleRoleFilter[activity.activityType].find(e => e === p.role) && p.people).map(p => `${p.people.firstName} ${p.people.name}`)
		else 
			return ''
	}
}
exports.activityMainPeople = (a, s) => activityPeople(a, true)
exports.activityOtherPeople = (a, s) => activityPeople(a, false)

// organization

const activityOrganization = (activity, main = true) => {

	let orgaRoleFilter={}
	if (main){
		orgaRoleFilter = {			
			partenariat: ['coordinateur'],
			projetderecherche: ['coordinateur'],
			mob_entrante: ['orgadorigine'],
			mob_sortante: ['orgadaccueil']
		};
	}
	else{
		orgaRoleFilter = {
			partenariat: ['partenaire'],
			projetderecherche: ['partenaire'],
			mob_entrante: ['orgadaccueil'],
			mob_sortante: ['orgadorigine']
		};
	}

	if (activity.organizations){
		if (orgaRoleFilter[activity.activityType]){
			return activity.organizations.filter(o => orgaRoleFilter[activity.activityType].find(e => e === o.role) && o.organization).map(o => o.organization.acronym || o.organization.name )
		}
		else
			// HDR and doctorat specific cases 
			if (main)
				return activity.organizations.filter(o => o.organization && o.organization.acronym !== 'FNSP').map(o => o.organization.acronym || o.organization.name )
			else
				return activity.organizations.filter(o => o.organization && o.organization.acronym === 'FNSP').map(o => o.organization.acronym || o.organization.name )
	}
}
exports.activityMainOrga = (a, s) => activityOrganization(a, true)
exports.activityOtherOrga = (a, s) => activityOrganization(a, false)