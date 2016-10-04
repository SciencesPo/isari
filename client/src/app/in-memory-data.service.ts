import { InMemoryDbService } from 'angular-in-memory-web-api';
export class InMemoryDataService implements InMemoryDbService {
  createDb() {

    let people = [
      {id: 1, name: 'Mr. Nice'}
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

    return {
      people,
      schemas,
      enums
    };
  }
}
