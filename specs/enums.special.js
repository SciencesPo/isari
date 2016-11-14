'use strict'

/* Sample usage

// Returning directly values (or promise of values)
exports.fakeEnum1 = {
  modelName: 'Fake',
  values: (object, field, objectId, fieldPath) => {
    return [ { value: "v1", label: { fr: 'v1 fr', en: 'v2 en' } } ]
  }
}

// Shortcut: returning name of a sub-key in 'enums.json', key being name of special enum
// in enums.json: "fakeEnum2": { "k1": […], "k2": […], … }
exports.fakeEnum2 = {
  modelName: 'Fake',
  values: (object, field) => 'k1'
}

*/


// Activity.people[].role ← Activity.activityType
// @see enums.json/activityPeopleRole
exports.activityPeopleRole = {
  modelName: 'Activity',
  key: (activity) => activity && activity.activityType
}


// People.personalActivities[].personalActivitySubtype ← People.personalActivities[].personalActivityType
// @see enums.json/personalActivitySubtype
exports.personalActivitySubtype = {
  modelName: 'People',
  key: (people, personalActivity) => personalActivity && personalActivity.personalActivityType
}
