import { InMemoryDbService } from 'angular-in-memory-web-api';
export class InMemoryDataService implements InMemoryDbService {
  createDb() {

    let people = [
      { id: 1, opts: { editable: true }, firstname: 'John', name: 'Doe', gender: 'm', birthdate: '1978-8' },
      { id: 2, opts: { editable: false }, firstname: 'Kyle', name: 'Dixon', gender: 'f' },
      { id: 3, opts: { editable: true }, firstname: 'Michael', name: 'Stein', composed: { subField: 'test sous champ' } }
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
          'composed': {
            'label': {
              'fr': 'composé', 'en': 'composed'
            },
            'type': 'object',
            'subField': {
              'label': { 'fr': 'sous', 'en': 'sub' }
            }
          }
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
            fields: [
              { name: 'firstname', 'label': { 'fr': 'Prénom', 'en': 'Firstname' }},
              { name: 'name', 'requirement': 'mandatory', 'label': { 'fr': 'Nom', 'en': 'Name' } }
            ]
          },
          {
            fields: [
              { name: 'gender', 'requirement': 'recommended', 'label': { 'fr': 'Genre', 'en': 'Gender' }, 'enum': 'genders' },
              {name: 'birthdate', 'requirement': 'recommended', 'label': { 'fr': 'Date de naissance', 'en': 'Birthdate' }, 'type': 'date' }
            ]
          },
          {
            fields: [
              {
                'name': 'composed',
                'label': { 'fr': 'composé', 'en': 'composed' },
                'type': 'object',
                layout: [
                  {
                    fields: [
                      { 'name': 'subField', 'label': { 'fr': 'sous', 'en': 'sub' } }
                    ]
                  }
                ]
             }
            ]
          }
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
