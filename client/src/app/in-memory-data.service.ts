import { InMemoryDbService } from 'angular-in-memory-web-api';
export class InMemoryDataService implements InMemoryDbService {
  createDb() {

    let people = [
      { id: 1, opts: { editable: true }, firstname: 'John', name: 'Doe', gender: 'm', birthdate: '1978-8' },
      { id: 2, opts: { editable: false }, firstname: 'Kyle', name: 'Dixon', gender: 'f' }
    ];

    let schemas = [
      {
        id: 'people',
        schema: {
          'firstname': {
              'label': { 'fr': 'Prénom', 'en': 'Firstname' }
          },
          'name': {
              'requirement': 'mandatory',
              'label': { 'fr': 'Nom', 'en': 'Name' }
          },
          'gender': {
              'requirement': 'recommended',
              'label': { 'fr': 'Genre', 'en': 'Gender' },
              'enum': 'genders'
          },
          'birthdate': {
              'requirement': 'recommended',
              'label': { 'fr': 'Date de naissance', 'en': 'Birthdate' },
              'type': 'date'
          },
          // 'nationalities': {
          //     'label': { 'fr': 'Nationalité(s)', 'en': 'Nationanality(ies)' },
          //     'enum': 'nationalities',
          //     'multiple': true
          // }
        }
      }
    ];

    let enums = [
      {
        id: 'genders',
        enum: [
          { 'value': 'm', 'label': { 'fr': 'Masculin', 'en': 'Male' } },
          { 'value': 'f', 'label': { 'fr': 'F\u00e9minin', 'en': 'Female' } },
          { 'value': 'o', 'label': { 'fr': 'Autre', 'en': 'Other' } }
        ]
      }
    ];

    let layouts = [
      {
        id: 'people',
        layout: [
          {
            label: { fr: 'groupe 1', en: 'group 1' },
            collapsabled: true,
            fields: ['firstname', 'name']
          },
          ['gender', 'birthdate'],
//          'nationalities'
        ]
      }
    ];

    return {
      people,
      schemas,
      enums,
      layouts
    };
  }
}

/*
[
  {
    "organization": "FNSP",
    "startDate": "2003-05-04",
    "timepart": 1,
    "jobName": "ingénieur de recherche",
    "jobType": "CDI",
    "jobTitle": "appui technique",
    "UG": "R12B",
    "gradesAdmin": [
      {
        "grade": "CM1",
        "startDate": "2003-05-04",
        "endDate": "2004-06-07"
      },
      {
        "grade": "CM2",
        "startDate": "2004-06-08"
      }
    ]
  }
]

{
  "multiple": true,
  "label": {
      "fr": "Contrats",
      "en": "Positions"
    },
    "organization": {
        "requirement": "mandatory",
        "suggestions": "top_10",
        "ref": "Organization"
    },
    "startDate": {
        "requirement": "mandatory",
        "label": { "fr": "Date de début", "en": "Start date" },
        "type": "date"
    },
    "endDate": {
      "label": { "fr": "Date de fin", "en": "End date" },
      "type": "date"
    },
    "jobName": {
      "label": { "fr": "Emploi personnalisé", "en": "Job name" }
    },
    "jobType": {
      "requirement": "mandatory",
      "label": { "fr": "Type de contrat", "en": "Contract type" },
      "enum": "jobType"
    },
    "timepart": {
      "label": { "fr": "Taux d'occupation", "en": "Part time rate" },
      "type": "number",
      "default": 1,
      "min": 0.05,
      "max": 1
    },
    "jobTitle": {
      "requirement": "recommended",
      "label": { "fr": "Fonction", "en": "Function" },
      "enum": "jobTitle"
    },
    "gradesAdmin": {
      multiple: true,
      "label": { "fr": "Emplois repère", "en": "Job grid" },
      "grade": {
        "requirement": "mandatory",
        "label": { "fr": "emplois repère", "en": "job level" },
        "enum": "gradeAdmin"
      },
      "startDate": {
        "requirement": "mandatory",
        "label": { "fr": "Date de début", "en": "Start date" },
        "type": "date"
      },
      "endDate": {
        "label": { "fr": "Date de fin", "en": "End date" },
        "type": "date"
      }
  }
}
*/
