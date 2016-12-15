'use strict'

exports.email = people => {
  if (!people.contacts)
    return '';

  const relevantContact = people.contacts.find(contact => !!contact.email);

  if (!relevantContact)
    return '';

  return relevantContact.email;
};
