'use strict'

//****** utils
const { formatEnum } = require('../server/lib/enums')

exports.email = (people, scope) => {
  if (!people.contacts)
    return '';

  const relevantContact = people.contacts.find(contact => !!contact.email);

  if (!relevantContact)
    return '';

  return relevantContact.email;
};

exports.membershipType = (people, scope) => {
  let af = people.academicMemberships.filter(e => e.organization._id.toString() === scope.organization)
  af.sort(e => e.startDate)

  if (af.length){
  	// take the last one
  	af = af[af.length -1]
  	af = {label: formatEnum('academicMembershipType', af.membershipType).label}
  	return af;
  }
  else
  	return '';
};