'use strict'

//****** utils
const { formatEnum } = require('../server/lib/enums');
const moment = require('../server/node_modules/moment');




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
  af.sort(e => e.startDate)

  if (af.length){
  	// take the last one
  	af = af[af.length -1]
  	af = formatEnum('academicMembershipType', af.membershipType)
  	return af;
  }
  else
  	return '';
};

exports.gradeStatus = (people, scope) => {
	if (people.grades){
	  let af = people.grades.sort(e => e.startDate)

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
	  let af = people.grades.sort(e => e.startDate)
	  if (af.length){
	  	// take the last one
	  	af = af[af.length -1]
	  	af = formatEnum('grade', [af.gradeStatus, af.grade])
	  	return af;
	  }
	}
  	return '';
};

