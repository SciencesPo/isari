/**
 * ISARI HCERES Annex 4 Export Routine
 * ====================================
 */
const Handlebars = require('handlebars'),
      mongoose = require('mongoose'),
      async = require('async'),
      helpers = require('./helpers.js'),
      COUNTRIES = require('../../specs/enum.countries.json'),
      {keyBy, sortBy} = require('lodash');

const {
  getSimpleEnumValues,
  getNestedEnumValues
} = require('../lib/enums');

const COUNTRIES_INDEX = keyBy(COUNTRIES, 'alpha2'),
      GRANT_PROGRAM_INDEX = keyBy(getSimpleEnumValues('grantPrograms'), 'value'),
      GRANT_INSTRUMENT_INDEX = Object.assign({}, getNestedEnumValues('grantInstruments'));

for (const k in GRANT_PROGRAM_INDEX)
  GRANT_PROGRAM_INDEX[k] = GRANT_PROGRAM_INDEX[k].label.fr;

for (const k in GRANT_INSTRUMENT_INDEX) {
  GRANT_INSTRUMENT_INDEX[k] = GRANT_INSTRUMENT_INDEX[k].reduce((index, item) => {
    index[item.value] = item.label.fr;
    return index;
  }, {});
}

const ObjectId = mongoose.Types.ObjectId;

const {
  parseDate,
  overlap
} = helpers;

const HCERESPERIOD = {startDate:'2012-01-01', endDate:'2017-06-30'};

/**
 * Handlebars templates.
 */
const TEMPLATES = {
  page: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Annexe 4 HCERES</title>
      </head>
      <body>
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
      </body>
    </html>
  `,
  groups: `
    <h2 id="{{id}}">{{title}}</h2>
    {{#each groups}}
      <h3>{{title}}</h3>
      <ul>
        {{#each people}}
          {{#each activities}}
            <li><strong>{{../firstName}} {{../name}}</strong>, {{summary}}{{#if startDate}}, {{formatRange .}}{{/if}}</li>
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
  `,
  contracts: `
    <h2 id="{{id}}">{{title}}</h2>
    {{#each groups}}
      <h3>{{title}}</h3>
      <ul>
        {{#each projects}}
          <li>
            <strong>{{name}}</strong>
            {{~#if acronym}} ({{acronym}}){{/if~}}
            {{~#if organization}}, {{organization}}{{/if~}}
            {{~#if program}}, {{program}}{{/if~}}
            {{~#if instrument}}, {{instrument}}{{/if~}}
            {{~#if manager}}, {{manager.firstName}} {{manager.name}}{{/if~}}
            {{~#if role}}, {{role}}{{/if~}}
            {{~#if startDate}}, {{formatRange .}}{{/if~}}
          </li>
        {{/each}}
      </ul>
    {{/each}}
  `,
  indices: `
    <h2 id="{{id}}">{{title}}</h2>
    <h3>Prix</h3>
    <h4>Attribués à des personnes</h4>
    <ul>
      {{#each distinctionPeople}}
        {{#each prices}}
          <li>
            <strong>{{../firstName}} {{../name}}</strong>
            {{~#if title}}, {{title}}{{/if~}}
            {{~#if date}}, {{formatDate date}}{{/if~}}
          </li>
        {{/each}}
      {{/each}}
    </ul>
    <h4>Attribués à des activités</h4>
    <ul>
      {{#each distinctionActivities}}
        {{#each prices}}
          <li>
            <strong>{{../name}}</strong>
            {{~#if title}}, {{title}}{{/if~}}
            {{~#if date}}, {{formatDate date}}{{/if~}}
          </li>
        {{/each}}
      {{/each}}
    </ul>
    <h4>Responsabilités dans des sociétés savantes</h4>
    <ul>
      {{#each savants}}
        {{#each activities}}
          <li>
            <strong>{{../firstName}} {{../name}}</strong>
            {{~#if summary}}, {{summary}}{{/if~}}
            {{~#if startDate}}, {{formatRange .}}{{/if~}}
          </li>
        {{/each}}
      {{/each}}
    </ul>
    <h4>Invitations à des colloques / congrès à l’étranger, séjours dans des laboratoires étrangers</h4>
    <ul>
      {{#each invited}}
        <li>
          <strong>{{firstName}} {{name}}</strong>
          {{~#if startDate}}, {{formatRange .}}{{/if~}}
          {{~#if organization}}, {{organization}}{{/if~}}
          {{~#if country}}, {{country}}{{/if~}}
        </li>
      {{/each}}
    </ul>
  `
};

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

function formatDate(date) {
  if (!date)
    return null;

  const format = FORMAT_MAP[date.split('-').length];

  return parseDate(date).format(format);
}
Handlebars.registerHelper('formatDate', formatDate);

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
              ) &&
              overlap(personalActivity,HCERESPERIOD)
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
              ) &&
              overlap(personalActivity,HCERESPERIOD)
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
              ) &&
              overlap(personalActivity,HCERESPERIOD)
            );
          }
        },
        {
          title: 'Évaluation d’articles et d’ouvrages scientifiques',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'editorial' &&
              personalActivity.role === 'reviewer' &&
              overlap(personalActivity,HCERESPERIOD)
            );
          }
        },
        {
          title: 'Évaluation de laboratoires (type Hceres)',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'évaluations' &&
              personalActivity.personalActivitySubtype === 'evaluationstructure' &&
              overlap(personalActivity,HCERESPERIOD)
            );
          }
        },
        {
          title: 'Évaluation de projets de recherche',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'évaluations' &&
              personalActivity.personalActivitySubtype === 'evaluationprojets' &&
              overlap(personalActivity,HCERESPERIOD)
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
              personalActivity.personalActivitySubtype === 'consultance' &&
              overlap(personalActivity,HCERESPERIOD)
            );
          }
        },
        {
          title: 'Participation à des instances d’expertises (type Anses) ou de normalisation',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'expertise' &&
              personalActivity.personalActivitySubtype === 'instance' &&
              overlap(personalActivity,HCERESPERIOD)
            );
          }
        },
        {
          title: 'Expertise juridique',
          predicate(personalActivity) {
            return (
              personalActivity.personalActivityType === 'expertise' &&
              personalActivity.personalActivitySubtype === 'juridique' &&
              overlap(personalActivity,HCERESPERIOD)
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
              ) &&
              overlap(personalActivity,HCERESPERIOD)
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
            .filter(org => org.organization)
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
          let person = activity.people.find(p => p.role === 'visiting')
          if (person)
            person = person.people;
          else
            return undefined;

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
        })
        .filter(p => p);

      return TEMPLATES.tab5({
        id,
        title,
        postDocs,
        invited
      });
    }
  },
  {
    id: 'contrats_de_recherche',
    title: '7. Contrats de recherche financés par des institutions publiques ou caritatives',
    render(id, title, data, centerId) {
      const activities = data.activities.filter(a => overlap(a,HCERESPERIOD));

      function mapper(activity) {
        const info = {
          acronym:'',
          name:'',
          organization:'',
          program:'',
          instrument:'',
          startDate:'',
          endDate:''
        };

        if (activity.acronym)
          info.acronym = activity.acronym;

        if (activity.name)
          info.name = activity.name;

        let grant = activity.grants.find(g => !!g.organization);

        if (grant)
          info.organization = grant.organization.name;
        else
          grant = activity.grants[0]

        if (grant && grant.grantProgram)
          info.program = GRANT_PROGRAM_INDEX[grant.grantProgram] || grant.grantProgram;

        if (grant && grant.grantInstrument && grant.grantType) {
          const index = GRANT_INSTRUMENT_INDEX[grant.grantType];
          info.instrument = index[grant.grantInstrument] || grant.grantInstrument;
        }

        if (activity.startDate)
          info.startDate = activity.startDate;

        if (activity.endDate)
          info.endDate = activity.endDate;

        const manager = activity.people.find(person => {
          return (
            person.role === 'responsableScientifique' ||
            person.role === 'PI'
          );
        });

        if (manager)
          info.manager = {
            firstName: manager.people.firstName,
            name: manager.people.name.toUpperCase()
          };

        const role = activity.organizations
          .find(({organization}) => '' + organization._id === centerId)
          .role;

        info.role = role;

        return info;
      }

      const projects = activities
        .filter(activity => {
          return (
            activity.activityType === 'projetderecherche'
          );
        });

      const european = projects
        .filter(activity => {
          return (
            !!activity.grants &&
            activity.grants &&
            activity.grants.some(grant => {
              return (
                ['ongoing','accepted'].includes(grant.status) &&
                (grant.grantType === 'collaboratifinternational' ||
                grant.grantType === 'individuelinternational')
              );
            })
          );
        })
        .map(mapper);

      const national = projects
        .filter(activity => {
          return (
            !!activity.grants &&
            activity.grants &&
            activity.grants.some(grant => {
              return (
                ['ongoing','accepted'].includes(grant.status) &&
                (grant.grantType === 'collaboratifnational' ||
                grant.grantType === 'individuelnational')
              );
            })
          );
        })
        .map(mapper);

      const territorial = projects
        .filter(activity => {
          return (
            !!activity.grants &&
            activity.grants &&
            activity.grants.some(grant => {
              return (
                ['ongoing','accepted'].includes(grant.status) &&
                (grant.grantType === 'collaboratifterritorial' ||
                grant.grantType === 'individuelterritorial')
              );
            })
          );
        })
        .map(mapper);

      const PIA = projects
        .filter(activity => {
          return (
            !!activity.grants &&
            activity.grants &&
            activity.grants.some(grant =>  
              ['ongoing','accepted'].includes(grant.status) &&
              grant.grantProgram === 'PIA')
          );
        })
        .map(mapper);

      const others = projects
        .filter(activity => {
          return (
            !!activity.grants &&
            activity.grants &&
            activity.grants.every(grant => {
              return(
                ['ongoing','accepted'].includes(grant.status) &&
                grant.grantProgram !== 'PIA' &&
                !['collaboratifterritorial',
                  'individuelterritorial',
                  'individuelnational',
                  'collaboratifnational',
                  'individuelinternational',
                  'collaboratifinternational',
                  'interne'].includes(grant.grantType)
                )
            })
            );
        })
        .map(mapper);

      return TEMPLATES.contracts({
        id,
        title,
        groups: [
          {
            title: 'Contrats européens (ERC, H2020, etc.) et internationaux (NSF, JSPS, NIH, Banque mondiale, FAO , etc.)',
            projects: european
          },
          {
            title: 'Contrats nationaux (ANR, PHRC, FUI, INCA, etc.)',
            projects: national
          },
          {
            title: 'Contrats avec les collectivités territoriales',
            projects: territorial
          },
          {
            title: 'Contrats financés dans le cadre du PIA',
            projects: PIA
          },
          {
            title: 'Contrats financés par des associations caritatives et des fondations (ARC, FMR, etc.)',
            projects: []
          },
          {
            title: 'Autres contrats à trier',
            projects: others
          }
        ]
      });
    }
  },
  {
    id: 'indices_reconnaissance',
    title: '8. Indices de reconnaissance',
    render(id, title, data) {

      const distinctionPeople = data.people
        .filter(person => {
          return (
            person.distinctions &&
            person.distinctions.some(distinction => 
              distinction.distinctionType === 'distinction' &&
              overlap({startDate:distinction.date, endDate:distinction.date}, HCERESPERIOD)
            )
          );
        })
        .map(person => {
          return {
            name: person.name.toUpperCase(),
            firstName: person.firstName,
            prices: person.distinctions
              .filter(distinction => distinction.distinctionType === 'distinction' &&
              overlap({startDate:distinction.date, endDate:distinction.date}, HCERESPERIOD)
              )
          };
        });

      const distinctionActivities = data.activities
        .filter(activity => {
          return (
            activity.activityType === 'projetderecherche' &&
            activity.distinctions &&
            activity.distinctions.length
          );
        })
        .map(activity => {
          return {
            name: activity.name,
            prices: activity.distinctions
          };
        });

      const savants = data.people
        .filter(person => {
          return (
            person.personalActivities &&
            person.personalActivities.some(personalActivity => {
              return (
                personalActivity.personalActivityType === 'collaborationsscientifiques' &&
                (
                  personalActivity.role === 'codirection' ||
                  personalActivity.role === 'direction' ||
                  personalActivity.role === 'présidence'
                ) &&
                overlap(personalActivity, HCERESPERIOD)
              );
            })
          );
        })
        .map(person => {
          return {
            name: person.name.toUpperCase(),
            firstName: person.firstName,
            activities: person.personalActivities
              .filter(personalActivity => {
                return (
                  personalActivity.personalActivityType === 'collaborationsscientifiques' &&
                  (
                    personalActivity.role === 'codirection' ||
                    personalActivity.role === 'direction' ||
                    personalActivity.role === 'présidence'
                  ) &&
                  overlap(personalActivity, HCERESPERIOD)
                );
              })
          };
        });

      let invited = data.activities
        .filter(activity => activity.activityType === 'mob_sortante')
        .map(activity => {

          const info = {
            startDate: activity.startDate,
            endDate: activity.endDate
          };

          const person = activity.people
            .find(p => !p.role || p.role === 'visiting')
          if (person){
            info.name = person.people.name.toUpperCase();
            info.firstName = person.people.firstName;
          }
          else{
            info.name = '???';
            info.firstName = '???';
          }

          const org = activity.organizations.find(o => o.role === 'orgadaccueil');
          if (org) {
            info.organization = org.organization.name;

            if (org.organization.countries && org.organization.countries[0])
              info.country = COUNTRIES_INDEX[org.organization.countries[0]].countryLabel.fr;
          }

          return info;
        });
        invited = sortBy(invited, info => info.name);
  

      return TEMPLATES.indices({
        id,
        title,
        distinctionPeople,
        distinctionActivities,
        savants,
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

  // TODO: check existence of center before!
  return async.parallel({
    people: next => {
      return People.aggregate([
        {
          $match: {
            academicMemberships: {
                $elemMatch:{
                  $and:[
                    {organization: ObjectId(centerId)},
                    {$or: [
                        {endDate:{$gte: HCERESPERIOD.startDate}},
                        {endDate:{$exists: false }}
                    ]},
                    {$or: [
                        {startDate:{$lte: HCERESPERIOD.endDate}},
                        {startDate:{$exists: false }}
                    ]}
                  ]
                }
            }
          }
        },
        {
          $sort:{
            'name': 1
          }
        }
      ], next);
    },
    activities: next => {
      return Activity
        .find({
          'organizations.organization': ObjectId(centerId)
        })
        .sort({'name':1,'acronym':1})
        .populate('people.people')
        .populate('organizations.organization')
        .populate('grants.organization')
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
