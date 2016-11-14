'use strict'


// Activity.people[].role
// people = Activity.people[$index]
// output depends on people's personalActivityType (???)
exports.activityPeopleRole = (activity, people) => {
  // TODO
}
// This is required by The System © to resolve activity from id (WARNING: CASE SENSITIVE)
exports.activityPeopleRole.modelName = 'Activity'


// People.personalActivities[].personalActivitySubtype
// personalActivity = people.personalActivities[$index]
exports.personalActivitySubtype = (people, personalActivity) => {
  // Grab personal activity type, if applicable
  const type = personalActivity && personalActivity.personalActivityType
  // Returns suggestions, can be empty (null, undefined, & co will be converted into []) by The System ©
  return activitySubTypes[type]
}
exports.personalActivitySubtype.modelName = 'People'


// DATA (may be require'd from an external module for better decoupling?)

const activitySubTypes = {
  "editorial": [
    {
      "value": "test",
      "label": { "fr": "subtype for editorial", "en": "subtype for editorial" }
    }
  ],
  "collaborationsscientifiques": [
    {
      "value": "test",
      "label": { "fr": "subtype for collaborationsscientifiques", "en": "subtype for collaborationsscientifiques" }
    }
  ],
  "expertise": [
    {
      "value": "test",
      "label": { "fr": "subtype for expertise", "en": "subtype for expertise" }
    }
  ],
  "jurys": [
    {
      "value": "test",
      "label": { "fr": "subtype for jurys", "en": "subtype for jurys" }
    }
  ],
  "encadrement": [
    {
      "value": "test",
      "label": { "fr": "subtype for encadrement", "en": "subtype for encadrement" }
    }
  ],
  "responsabilitésetmandats": [
    {
      "value": "test",
      "label": { "fr": "subtype for responsabilitésetmandats", "en": "subtype for responsabilitésetmandats" }
    }
  ],
  "évaluations": [
    {
      "value": "test",
      "label": { "fr": "subtype for évaluations", "en": "subtype for évaluations" }
    }
  ],
  "enseignement": [
    {
      "value": "test",
      "label": { "fr": "subtype for enseignement", "en": "subtype for enseignement" }
    }
  ]
}
