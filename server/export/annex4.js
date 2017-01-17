/**
 * ISARI HCERES Annex 4 Export Routine
 * ====================================
 */
const Handlebars = require('handlebars');

const TEMPLATES = {
  1: `
    <h1>Participation à des comités éditoriaux (revues, collections)</h1>
    <ul>
      {{#each firstGroup}}
        {{#each activities}}
          <li>{{../firstName}} {{../name}}: {{description}}</li>
        {{/each}}
      {{/each}}
    </ul>
    <h1>Direction de collections et de séries</h1>
    <ul>
      {{#each secondGroup}}
        {{#each activities}}
          <li>{{../firstName}} {{../name}}: {{description}}</li>
        {{/each}}
      {{/each}}
    </ul>
  `
};

for (const k in TEMPLATES)
  TEMPLATES[k] = Handlebars.compile(TEMPLATES[k]);

/**
 * Process.
 */
module.exports = {

  // 1. Activités éditoriales
  1(models, centerId, callback) {
    const People = models.People;

    function firstGroupPredicate(personalActivity) {
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

    const secondGroupRoles = new Set(['direction', 'codirection', 'présidence']);

    function secondGroupPredicate(personalActivity) {
      return (
        personalActivity.personalActivityType === 'editorial' &&
        (
          personalActivity.personalActivitySubtype === 'collectionScientifique' &&
          secondGroupRoles.has(personalActivity.role)
        )
      );
    }

    function groupMapper(predicate, person) {
      return {
        firstName: person.firstName,
        name: person.name,
        activities: person.personalActivities.filter(predicate)
      };
    }

    // Finding people having an academicMembership on our center
    return People.find({
      'academicMemberships.organization': centerId
    }, (err, people) => {
      if (err)
        return callback(err);

      people = people.map(person => person.toObject());

      const firstGroup = people
        .filter(person => {
          return (
            person.personalActivities &&
            person.personalActivities.some(firstGroupPredicate)
          );
        })
        .map(groupMapper.bind(null, firstGroupPredicate));

      const secondGroup = people
        .filter(person => {
          return (
            person.personalActivities &&
            person.personalActivities.some(secondGroupPredicate)
          );
        })
        .map(groupMapper.bind(null, secondGroupPredicate));

      // Applying template
      const html = TEMPLATES[1]({
        firstGroup,
        secondGroup
      });

      return callback(null, html);
    });
  }
};
