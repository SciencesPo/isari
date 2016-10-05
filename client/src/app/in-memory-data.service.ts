import { InMemoryDbService } from 'angular-in-memory-web-api';
export class InMemoryDataService implements InMemoryDbService {
  createDb() {

    let people = [
      { id: 1, opts: { editable: true }, firstname: 'John', name: 'Doe' },
      { id: 2, opts: { editable: false }, firstname: 'Kyle', name: 'Dixon' }
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
          'nationalities': {
              'label': { 'fr': 'Nationalité(s)', 'en': 'Nationanality(ies)' },
              'enum': 'nationalities',
              'multiple': true
          }
        }
      }
    ];

    let enums = [
      {
        genders: ['m', 'f', 'o']
      }
    ];

    let layouts = [
      {
        id: 'people',
        layout: [
          {
            label: 'group 1',
            collapsabled: true,
            fields: ['firstname', 'lastname']
          },
          ['gender', 'birthdate'],
          'nationalities'
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
