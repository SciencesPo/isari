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
  page: `
    <h1>HCERES - Annexe 4</h1>
    <h2>Sommaire:</h2>
    <ul>
      {{#each tabs}}
        <li>
          <a href="#{{id}}">{{title}}</a>
        </li>
      {{/each}}
    </ul>
    {{#each tabs}}
      {{{html}}}
    {{/each}}
  `,
  groups: `
    <h2 id="{{id}}">{{title}}</h2>
    {{#each groups}}
      <h3>{{title}}</h3>
      <ul>
        {{#each people}}
          {{#each activities}}
            <li><strong>{{../firstName}} {{../name}}</strong>, <em>{{description}}</em>{{#if startDate}}, {{formatRange .}}{{/if}}</li>
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
    const {title, predicate} = definition;

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
          name: person.name.toUpperCase(),
          activities: person.personalActivities.filter(predicate)
        };
      });

    return {title, people: groupPeople};
  });
}

/**
 * Tab definitions.
 */
const TABS = [
  {
    id: 'activites_editoriales',
    title: '1. Activités éditoriales',
    render(id, title, people) {
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

      const groups = computeGroups(groupDefinitions, people);

      // Applying template
      return TEMPLATES.groups({
        id,
        title,
        groups
      });
    }
  },
  {
    id: 'activites_evaluation',
    title: '2. Activités d\'évaluation',
    render(id, title, people) {
      const groupDefinitions = [
        {
          title: 'Responsabilités au sein d’instances d’évaluation',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'évaluations' &&
              (
                personalActivity.personalActivitySubtype === 'responsinstanceevaluation' ||
                personalActivity.personalActivitySubtype === 'communauteprogrammation' ||
                personalActivity.personalActivitySubtype === 'evaluationpairs'
              )
            );
          }
        },
        {
          title: 'Évaluation d’articles et d’ouvrages scientifiques',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'editorial' &&
              personalActivity.role === 'reviewer'
            );
          }
        },
        {
          title: 'Évaluation de laboratoires (type Hceres)',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'editorial' &&
              personalActivity.personalActivitySubtype === 'evaluationstructure'
            );
          }
        },
        {
          title: 'Évaluation de projets de recherche',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'évaluation' &&
              personalActivity.personalActivitySubtype === 'evaluationprojets'
            );
          }
        }
      ];

      const groups = computeGroups(groupDefinitions, people);

      // Applying template
      return TEMPLATES.groups({
        id,
        title,
        groups
      });
    }
  },
  {
    id: 'activites_expertise_scientifique',
    title: '3. Activités d\'expertise scientifique',
    render(id, title, people) {
      const groupDefinitions = [
        {
          title: 'Activités de consultant',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'expertise' &&
              personalActivity.personalActivitySubtype === 'consultance'
            );
          }
        },
        {
          title: 'Participation à des instances d’expertises (type Anses) ou de normalisation',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'expertise' &&
              personalActivity.personalActivitySubtype === 'instance'
            );
          }
        },
        {
          title: 'Expertise juridique',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'expertise' &&
              personalActivity.personalActivitySubtype === 'juridique'
            );
          }
        },
        {
          title: 'Autres expertise (Sciences Po)',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'expertise' &&
              (
                !personalActivity.personalActivitySubtype ||
                personalActivity.personalActivitySubtype === 'audition' ||
                personalActivity.personalActivitySubtype === 'rapport'
              )
            );
          }
        }
      ];

      const groups = computeGroups(groupDefinitions, people);

      // Applying template
      return TEMPLATES.groups({
        id,
        title,
        groups
      });
    }
  }
];

/**
 * Process.
 */
module.exports = function annex4(models, centerId, callback) {
  const People = models.People;

  return People.find({
    'academicMemberships.organization': centerId
  }, (err, people) => {
    if (err)
      return callback(err);

    people = people.map(person => person.toObject());

    // Rendering tabs
    const tabs = TABS.map(tab => {
      return {
        id: tab.id,
        title: tab.title,
        html: tab.render(tab.id, tab.title, people)
      };
    });

    // Rendering the full page
    const html = TEMPLATES.page({tabs});

    return callback(null, html);
  });
};
