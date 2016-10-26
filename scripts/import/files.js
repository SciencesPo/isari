/**
 * ISARI Import Scripts File Definitions
 * ======================================
 *
 * Defining the various files to import as well as their line consumers.
 */
const moment = require('moment'),
      chalk = require('chalk');

const _ = require('lodash');

const ENUM_INDEXES = require('./indexes.js').ENUM_INDEXES;

moment.prototype.inspect = function() {
  return 'Moment{' + this.format('YYYY-MM-DD') + '}';
};
moment.prototype.toString = moment.prototype.inspect;

module.exports = {

  /**
   * Organization Files.
   * ---------------------------------------------------------------------------
   */
  organizations: {
    folder: 'organizations',
    files: [

      /**
       * default_organizations.csv
       */
      {
        name: 'default',
        path: 'default_organizations.csv',
        delimiter: ',',
        consumer(line) {
          const info = {
            name: line.name,
            address: line.address,
            country: line.country,
            status: line.status,
            organizationTypes: [line.organizationType]
          };

          if (line.acronym)
            info.acronym = line.acronym;
          if (line.url)
            info.url = line.url;
          if (line.parent_organisations)
            line.parentOrganizations = [line.parent_organisations];

          return info;
        },
        indexer(indexes, org) {
          if (org.acronym)
            indexes.acronym[org.acronym] = org;
          if (org.name)
            indexes.name[org.name] = org;
        }
      },

      /**
       * sciencespo_research_units.csv
       */
      {
        name: 'research_units',
        path: 'sciencespo_research_units.csv',
        delimiter: ',',
        consumer(line) {
          let researchUnitCodes = [];

          if (line.researchUnitCodes) {
            researchUnitCodes = JSON.parse(line.researchUnitCodes);
          }

          // Normalizing dates
          researchUnitCodes.forEach(item => {
            item.startDate = moment(item.startDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
            if (item.endDate)
              item.endDate = moment(item.endDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
          });

          const info = {
            researchUnitCodes,
            name: line.name,
            address: line.address,
            url: line.url,
            status: line.status
          };

          if (line.acronym)
            info.acronym = line.acronym;

          if (line.idRnsr)
            info.idRnsr = line.idRnsr;

          if (line.parentOrganizations)
            info.parentOrganizations = line.parentOrganizations.split(',');

          if (line.idScopus)
            info.idScopus = line.idScopus;

          if (line.organizationTypes)
            info.organizationTypes = line.organizationTypes.split(',');

          return info;
        },
        indexer(indexes, org) {
          if (org.acronym)
            indexes.acronym[org.acronym] = org;
          if (org.name)
            indexes.name[org.name] = org;
        }
      }
    ]
  },

  /**
   * People Files.
   * ---------------------------------------------------------------------------
   */
  people: {
    folder: 'people',
    files: [

      /**
       * SIRH.csv
       */
      {
        name: 'sirh',
        path: 'SIRH.csv',
        delimiter: ',',
        consumer(line, index) {
          const info = {
            year: line.Année,
            name: line['Nom usuel'],
            firstName: line.Prénom,
            birthName: line['Nom de naissance'] || line['Nom usuel'],
            sirhMatricule: line.Matricule,
            birthDate: line['Date de naissance'],
            gender: line.gender,
            startDate: moment(line['Date de début'], 'YYYY-MM-DD'),
            jobType: line['Type de contrat'],
            gradeSirh: line['Emploi Repère'],
            jobName: line['Emploi Personnalisé'],
            academicMembership: line.Affiliation
          };

          if (line['%ETP'])
            info.timepart = +line['%ETP'].replace(/,/g, '.');

          let nationality = line.Nationalité;

          if (nationality) {
            nationality = ENUM_INDEXES.countries.alpha3[nationality];

            if (!nationality)
              this.error(`Line ${index + 1}: unknown nationality ${chalk.cyan(line.Nationalité)}`);
            else
              info.nationality = nationality.alpha2;
          }

          // Handling endDate
          let endDate;

          if (line['Date fin présumée'] && line['Date de sortie adm'])
            endDate = moment.min(
              moment(line['Date fin présumée'], 'YYYY-MM-DD'),
              moment(line['Date de sortie adm'], 'YYYY-MM-DD')
            )
          else if (line['Date fin présumée'])
            endDate = moment(line['Date fin présumée'], 'YYYY-MM-DD');
          else if (line['Date de sortie adm'])
            endDate = moment(line['Date de sortie adm'], 'YYYY-MM-DD');

          if (endDate)
            info.endDate = endDate;

          return info;
        },
        resolver(lines) {

          // First we need to group the person by matricule
          let persons = _.values(_.groupBy(lines, 'sirhMatricule'));

          this.info(`Extracted ${chalk.cyan(persons.length)} persons.`);

          // Sorting lines by year
          persons = persons.map(years => {
            return _.sortBy(years, 'year');
          });

          // Creating people objects
          // .filter(p => p[0].name === 'OLIVIER')
          const objects = persons.map(years => {
            const first = years[0],
                  last = years[years.length - 1];

            const person = {
              firstName: first.firstName,
              name: last.name,
              birthName: first.birthName,
              sirhMatricule: first.sirhMatricule,
              gender: last.gender,
              nationalities: [last.nationality]
            };

            // Computing positions
            const slices = _.groupBy(years, y => `${y.startDate}§${y.endDate || ''}`),
                  positions = [];

            _.values(slices).forEach((slice, i) => {
              const nextSlice = slices[i + 1],
                    contract = slice[0],
                    nextContract = (nextSlice || [])[0] || {};

              const position = {
                organization: 'FNSP',
                jobName: contract.jobName,
                jobType: contract.jobType,
                timepart: contract.timepart
              };

              // Dates
              if (nextContract.startDate && contract.endDate) {
                if (nextContract.startDate.isBefore(contract.endDate))
                  contract.endDate = nextContract.startDate.substract(1, 'days');
              }

              if (contract.startDate)
                position.startDate = contract.startDate.format('YYYY-MM-DD');
              if (contract.endDate)
                position.endDate = contract.endDate.format('YYYY-MM-DD');

              // Grades
              position.grades = _(slice)
                .groupBy('gradeSirh')
                .values()
                .map(grades => grades[0])
                .map((grade, i, grades) => {
                  const previousGrade = grades[i - 1],
                        nextGrade = grades[i + 1];

                  const info = {
                    grade: grade.gradeSirh
                  };

                  if (grade.startDate) {
                    if (!i)
                      info.startDate = grade.startDate.format('YYYY');
                    else
                      info.startDate = grade.year;
                  }
                  if (grade.endDate) {
                    if (!previousGrade && nextGrade)
                      info.endDate = nextGrade.year;
                    else
                      info.endDate = grade.endDate.format('YYYY');
                  }

                  return info;
                })
                .value();

              positions.push(position);
            });

            person.positions = positions;

            // Computing academic memberships
            person.academicMemberships = _(years)
              .groupBy('academicMembership')
              .values()
              .map(memberships => memberships[0])
              .map(membership => {
                const info = {
                  organization: membership.academicMembership
                };

                if (membership.startDate)
                  info.startDate = membership.startDate.format('YYYY-MM-DD');
                if (membership.endDate)
                  info.endDate = membership.endDate.format('YYYY-MM-DD');

                return info;
              })
              .value();


            // TODO: here...

            return person;
          });

          console.log(objects[0]);

          return objects;
        }
      }
    ]
  }
};

// academicMembership lien org temps split simple
// TODO: grossmann changement de grade même start date dans le contrat
