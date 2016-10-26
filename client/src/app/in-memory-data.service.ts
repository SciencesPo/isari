import { InMemoryDbService } from 'angular-in-memory-web-api';
export class InMemoryDataService implements InMemoryDbService {
  createDb() {

    let people = [
      { id: 1, opts: { editable: true }, firstname: 'John', name: 'Doe', gender: 'm', birthdate: '1978-8',
        tag: [{bla: 'un' }, {bla: 'deux'}],
        friend: 2
      },
      { id: 2, opts: { editable: false }, firstname: 'Kyle', name: 'Dixon', gender: 'f' },
      { id: 3, opts: { editable: true }, firstname: 'Michael', name: 'Stein', composed: { subField: 'test sous champ' } }
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
            label: { fr: 'Genre, Date de naissance', en: 'Gender, Birthdate' },
            fields: [
              { name: 'gender', 'requirement': 'recommended', 'label': { 'fr': 'Genre', 'en': 'Gender' }, 'enum': 'genders' },
              { name: 'birthdate', 'requirement': 'recommended', 'label': { 'fr': 'Date de naissance', 'en': 'Birthdate' }, 'type': 'date' }
            ]
          },
          {
            label: { fr: 'groupe composé', en: 'composed group' },
            fields: [
              {
                'name': 'composed',
                'label': { 'fr': 'composé', 'en': 'composed' },
                'type': 'object',
                layout: [
                  {
                    label: {fr: 'sous', en: 'sub' },
                    fields: [
                      { 'name': 'subField', 'label': { 'fr': 'sous', 'en': 'sub' } },
                      { name: 'xgender', 'label': { 'fr': 'Genre', 'en': 'Gender' }, 'softenum': 'genders' },
                      { name: 'friend', label: { fr: 'ami', en: 'friend' }, ref: 'people' }
                    ]
                  }
                ]
             }
            ]
          },
          {
            label: { fr: 'tags', en: 'tags' },
            fields: [
              {
                name: 'tag',
                label: { fr: 'tag', en: 'tag' },
                multiple: true,
                type: 'object',
                layout: [
                  {
                    label: { fr: 'tag', en: 'tag' },
                    fields: [
                      { 'name': 'bla', label: { 'fr': 'bla', 'en': 'bla' } },
                      { 'name': 'ygender', label: { 'fr': 'ygender', 'en': 'ygender' }, enum: 'genders' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    let schemas = [
      {
        id: 'people',
        schema: {
          name: {
            label: { fr: 'Nom', en: 'Name' }
          },
          age: {
            label: { fr: 'Age', en: 'Age' }
          }
        }
      }
    ];

    return {
      people,
      enums,
      layouts,
      schemas
    };
  }
}
