'use strict'

//****** utils
const { formatEnum } = require('../server/lib/enums');
const moment = require('../server/node_modules/moment');
const _ = require('../server/node_modules/lodash');
const { overlap, formatDate } = require('../server/export/helpers');

const selectPeriodFromScope = (periods, scope) => {	
	const thisMonth = moment().format('YYYY-MM');
	const scopePeriod = {
		startDate: scope.start ? scope.start : thisMonth,
		endDate: scope.end ? scope.end : thisMonth
	};
	// keep only periods active during scope or this month
    return _.sortBy(periods.filter(p => overlap(p,scopePeriod)), [p => p.endDate || p.startDate]).reverse()
}


exports.email = (people, scope) => {
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

  let af = people.academicMemberships.filter(e => e.organization._id.toString() === scope.organization)
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
	  let af = _.sortBy(people.grades, [e => e.startDate])

	  if (af.length){
	  	// take the last one
	  	af = af[af.length -1]
	  	af = formatEnum('gradeStatus', af.gradeStatus)
	  	return af;
	  }
	}

  return '';
};

exports.grade = (people, scope) => {
	if (people.grades){
	  let af = _.sortBy(people.grades, [e => e.startDate])
	  
	  if (af.length){
	  	// take the last one
	  	af = af[af.length -1]
	  	af = formatEnum('grade', [af.gradeStatus, af.grade])
	  	return af;
	  }
	}
  	return '';
};

exports.entryDate = (people, scope) => {
	if (people.academicMemberships)
	  return _.min(people.academicMemberships.filter(e => e.organization._id.toString() === scope.organization).map(e => formatDate(e.startDate)))
  	return '';
};

exports.leavingDate = (people, scope) => {
	if (people.academicMemberships)
	  return _.max(people.academicMemberships.filter(e => e.organization._id.toString() === scope.organization).map(e => formatDate(e.endDate)))
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

 exports.degree = (people, scope) => {
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

