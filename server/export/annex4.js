/**
 * ISARI HCERES Annex 4 Export Routine
 * ====================================
 */
const Handlebars = require('handlebars'),
      parseDate = require('./helpers.js').parseDate;

/**
 * Handlebars templates.
 */
const TEMPLATES = {
  groups: `
    {{#each groups}}
      <h1>{{title}}</h1>
      <ul>
        {{#each people}}
          {{#each activities}}
            <li>{{../firstName}} {{../name}}, {{description}}{{#if startDate}}, {{formatRange .}}{{/if}}</li>
          {{/each}}
        {{/each}}
      </uL>
    {{/each}}
  `
};

for (const k in TEMPLATES)
  TEMPLATES[k] = Handlebars.compile(TEMPLATES[k]);

/**
 * Helpers.
 */
function formatRange(item) {
  let {startDate, endDate} = item;

  if (startDate)
    startDate = parseDate(startDate);
  if (endDate)
    endDate = parseDate(endDate);

  if (!startDate && !endDate)
    return null;

  if (startDate && !endDate)
    return `depuis ${startDate.format('DD/MM/YYYY')}`;

  if (!endDate)
    return null;

  return `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`;
}
Handlebars.registerHelper('formatRange', formatRange);

function computeGroups(definitions, people) {
  return definitions.map(definition => {
    const {title, predicate, mapper} = definition;

    const groupPeople = people
      .filter(person => {
        return (
          person.personalActivities &&
          person.personalActivities.some(predicate)
        );
      })
      .map(person => {
        return {
          firstName: person.firstName,
          name: person.name,
          activities: person.personalActivities.filter(predicate)
        };
      });

    return {title, people: groupPeople};
  });
}

/**
 * Process.
 */
module.exports = {

  // 1. Activités éditoriales
  1(models, centerId, callback) {
    const People = models.People;

    const secondGroupRoles = new Set(['direction', 'codirection', 'présidence']);

    const groupDefinitions = [
      {
        title: 'Participation à des comités éditoriaux (revues, collections)',
        predicate(personalActivity) {
          return (
            personalActivity.personalActivityType === 'editorial' &&
            (
              !personalActivity.personalActivitySubtype ||
              personalActivity.personalActivitySubtype === 'revueScientifique' ||
              (
                personalActivity.personalActivitySubtype === 'collectionScientifique' &&
                personalActivity.role === 'membre'
              )
            )
          );
        }
      },
      {
        title: 'Direction de collections et de séries',
        predicate(personalActivity) {
          return (
            personalActivity.personalActivityType === 'editorial' &&
            (
              personalActivity.personalActivitySubtype === 'collectionScientifique' &&
              secondGroupRoles.has(personalActivity.role)
            )
          );
        }
      }
    ];

    // Finding people having an academicMembership on our center
    return People.find({
      'academicMemberships.organization': centerId
    }, (err, people) => {
      if (err)
        return callback(err);

      people = people.map(person => person.toObject());

      const groups = computeGroups(groupDefinitions, people);

      // Applying template
      const html = TEMPLATES.groups({groups});

      return callback(null, html);
    });
  },

  2(models, centerId, callback) {
    const People = models.People;

    // Finding people having an academicMembership on our center
    return People.find({
      'academicMemberships.organization': centerId
    }, (err, people) => {
      if (err)
        return callback(err);

      people = people.map(person => person.toObject());

      // Applying template
      const html = TEMPLATES[2]({});

      return callback(null, html);
    });
  }
};
