/**
 * ISARI HCERES Annex 4 Export Routine
 * ====================================
 */
const Handlebars = require('handlebars'),
      mongoose = require('mongoose'),
      async = require('async'),
      helpers = require('./helpers.js'),
      COUNTRIES = require('../../specs/enum.countries.json'),
      keyBy = require('lodash/keyBy');

const COUNTRIES_INDEX = keyBy(COUNTRIES, 'alpha2');

const ObjectId = mongoose.Types.ObjectId;

const {
  parseDate,
  overlap
} = helpers;

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
            <li><strong>{{../firstName}} {{../name}}</strong>, <em><u>{{description}}</u></em>{{#if startDate}}, {{formatRange .}}{{/if}}</li>
          {{/each}}
        {{/each}}
      </uL>
    {{/each}}
  `,
  tab5: `
    <h2 id="{{id}}">{{title}}</h2>
    <h3>Post-doctorants</h3>
    <ul>
      {{#each postDocs}}
        <li><strong>{{firstName}} {{name}}</strong>{{#if startDate}}, {{formatRange .}}{{/if}}</li>
      {{/each}}
    </ul>
    <h3>Chercheurs accueillis</h3>
    <ul>
      {{#each invited}}
        <li><strong>{{firstName}} {{name}}</strong>{{#if organization}}, {{organization}}{{#if country}} ({{country}}){{/if}}{{/if}}{{#if startDate}}, {{formatRange .}}{{/if}}</li>
      {{/each}}
    </ul>
  `
};

// people.name people.firstName, orga d’origine, pays de l’orga d’origine, activity.startDate - activity.endDate

for (const k in TEMPLATES)
  TEMPLATES[k] = Handlebars.compile(TEMPLATES[k]);

/**
 * Helpers.
 */
const FORMAT_MAP = {
  1: 'YYYY',
  2: 'MM/YYYY',
  3: 'DD/MM/YYYY'
};

function formatRange(item) {
  let {startDate, endDate} = item;

  let startDateFormat,
      endDateFormat;

  if (startDate) {
    startDateFormat = FORMAT_MAP[startDate.split('-').length];
    startDate = parseDate(startDate);
  }
  if (endDate) {
    endDateFormat = FORMAT_MAP[endDate.split('-').length];
    endDate = parseDate(endDate);
  }

  if (!startDate && !endDate)
    return null;

  if (startDate && !endDate)
    return `depuis ${startDate.format(startDateFormat)}`;

  return `${startDate.format(startDateFormat)} - ${endDate.format(endDateFormat)}`;
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
    render(id, title, data) {
      const people = data.people;

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
    render(id, title, data) {
      const people = data.people;

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
    render(id, title, data) {
      const people = data.people;

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
  },
  {
    id: 'post_doctorants_chercheurs_accueillis',
    title: '5.  Post-doctorants et chercheurs accueillis',
    render(id, title, data, centerId) {
      const {people, activities} = data;

      // Tagging relevant memberships
      people.forEach(person => {
        const membership = person.academicMemberships
          .find(m => '' + m.organization === centerId);

        person.relevantMembership = membership;
      });

      // Finding postdocs
      const postDocs = people
        .filter(person => {

          return (
            person.grades &&
            person.grades.length &&
            person.grades.some(grade => {
              return (
                !!grade.startDate &&
                grade.grade === 'postdoc' &&
                overlap(grade, person.relevantMembership)
              );
            })
          );
        })
        .map(person => {
          const relevantGrade = person.grades.find(grade => {
            return (
              !!grade.startDate &&
              overlap(grade, person.relevantMembership)
            );
          });

          return {
            name: person.name.toUpperCase(),
            firstName: person.firstName,
            startDate: relevantGrade.startDate,
            endDate: relevantGrade.endDate
          };
        });

      const invited = activities
        .filter(activity => {
          const role = activity.organizations
            .find(org => '' + org.organization._id === centerId)
            .role;

          const startDate = activity.startDate && parseDate(activity.startDate),
                endDate = activity.endDate && parseDate(activity.endDate);

          return (
            activity.activityType === 'mob_entrante' &&
            role === 'orgadaccueil' &&
            (
              startDate &&
              startDate.isSameOrAfter('2012-01-01')
            ) &&
            (
              !endDate ||
              endDate.isSameOrBefore('2017-06-30')
            )
          );
        })
        .map(activity => {
          const person = activity.people.find(p => p.role === 'visiting').people;

          let origin = activity.organizations.find(org => org.role === 'orgadorigine');

          origin = origin ? origin.organization : {};

          const info = {
            name: person.name.toUpperCase(),
            firstName: person.firstName,
            organization: origin.name || 'UNKNOWN ORGANIZATION',
            startDate: activity.startDate,
            endDate: activity.endDate
          };

          if (origin.countries && origin.countries[0])
            info.country = COUNTRIES_INDEX[origin.countries[0]].countryLabel.fr;

          return info;
        });

      return TEMPLATES.tab5({
        id,
        title,
        postDocs,
        invited
      });
    }
  }
];

/**
 * Process.
 */
module.exports = function annex4(models, centerId, callback) {
  const {Activity, People} = models;

  return async.parallel({
    people: next => {
      return People.aggregate([
        {
          $match: {
            'academicMemberships.organization': ObjectId(centerId)
          }
        }
      ], next);
    },
    activities: next => {
      return Activity
        .find({
          'organizations.organization': ObjectId(centerId)
        })
        .populate('people.people')
        .populate('organizations.organization')
        .exec(next);
    }
  }, (err, data) => {
    if (err)
      return callback(err);

    // Rendering tabs
    const tabs = TABS.map(tab => {
      return {
        id: tab.id,
        title: tab.title,
        html: tab.render(tab.id, tab.title, data, centerId)
      };
    });

    // Rendering the full page
    const html = TEMPLATES.page({tabs});

    return callback(null, html);
  });
};
