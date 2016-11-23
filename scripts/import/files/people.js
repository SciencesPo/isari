/**
 * ISARI Import Scripts People File Definitions
 * =============================================
 */
const moment = require('moment'),
      ENUM_INDEXES = require('../indexes').ENUM_INDEXES,
      helpers = require('../helpers'),
      chalk = require('chalk'),
      partitionBy = helpers.partitionBy,
      hashPeople = helpers.hashPeople,
      overlap = helpers.overlap,
      _ = require('lodash');

module.exports = {
  files: [

    /**
     * SIRH.csv
     * -------------------------------------------------------------------------
     */
    {
      name: 'sirh',
      path: 'people/SIRH.csv',
      delimiter: ',',
      consumer(line, index) {
        const info = {
          year: line.Année,
          name: line['Nom usuel'],
          firstName: line.Prénom,
          birthName: line['Nom de naissance'],
          sirhMatricule: line.Matricule,
          birthDate: line['Date de naissance'],
          gender: line.gender,
          startDate: moment(line['Date de début'], 'YYYY-MM-DD'),
          jobType: line['Type de contrat'],
          gradeSirh: line['Emploi Repère'],
          jobName: line['Emploi Personnalisé'],
          academicMembership: line.Affiliation
        };

        // add 0 prefix to sirh matricule which were cut by a spreadsheet software
        if (info.sirhMatricule.length < 5)
          info.sirhMatricule = '0'.repeat(5 - info.sirhMatricule.length) + info.sirhMatricule;

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
          );
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
        let persons = partitionBy(lines, 'sirhMatricule');

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
            sirhMatricule: first.sirhMatricule,
            gender: last.gender,
            nationalities: [last.nationality],
            birthDate: first.birthDate
          };

          if (first.birthName && first.birthName !== first.name)
            person.birthName = first.birthName;

          // Computing positions
          const slices = partitionBy(years, y => `${y.startDate}§${y.endDate || ''}`),
                positions = [];

          slices.forEach((slice, sliceIndex) => {
            const nextSlice = slices[sliceIndex + 1],
                  contract = slice[0],
                  nextContract = (nextSlice || [])[0] || {};

            const position = {
              organization: 'FNSP',
              jobType: contract.jobType,
              timepart: contract.timepart
            };

            const jobNameLine = slice.find(line => !!line.jobName);

            if (jobNameLine)
              position.jobName = jobNameLine.jobName;

            // Dates
            if (nextContract.startDate && contract.endDate) {
              if (nextContract.startDate.isBefore(contract.endDate))
                contract.endDate = nextContract.startDate.subtract(1, 'days');
            }

            if (contract.startDate)
              position.startDate = contract.startDate.format('YYYY-MM-DD');
            if (contract.endDate)
              position.endDate = contract.endDate.format('YYYY-MM-DD');

            // Grades
            position.gradesSirh = _(slice)
              .groupBy('gradeSirh')
              .values()
              .map(grades => grades[0])
              .map((grade, i, grades) => {
                const nextGrade = grades[i + 1];

                const info = {
                  grade: grade.gradeSirh
                };

                if (grade.startDate) {
                  if (!i)
                    info.startDate = grade.startDate.format('YYYY');
                  else
                    info.startDate = grade.year;
                }

                if (grades.length === 1) {
                  if (grade.endDate)
                    info.endDate = grade.endDate.format('YYYY');
                }
                else {
                  if (nextGrade)
                    info.endDate = nextGrade.year;
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
            .map(memberships => _.last(memberships))
            .map((membership, i, memberships) => {
              const nextMembership = memberships[i + 1];

              const info = {
                organization: membership.academicMembership,
                membershipType: 'membre'
              };

              if (membership.startDate) {
                  if (!i)
                    info.startDate = membership.startDate.format('YYYY');
                  else
                    info.startDate = membership.year;
                }

                if (memberships.length === 1) {
                  if (membership.endDate)
                    info.endDate = membership.endDate.format('YYYY');
                }
                else {
                  if (nextMembership)
                    info.endDate = nextMembership.year;
                }

              return info;
            })
            .filter(membership => {
              return !!membership.organization;
            })
            .value();

          return person;
        });

        return objects;
      },
      indexer(indexes, person) {
        indexes.id[person._id] = person;
        indexes.hashed[hashPeople(person)] = person;
        indexes.sirh[person.sirhMatricule] = person;
      }
    },

    /**
     * DS_admtech.csv
     * -------------------------------------------------------------------------
     */
    {
      name: 'DS_admtech',
      path: 'people/DS_admtech.csv',
      delimiter: ',',
      consumer(line) {
        const info = {
          year: line.Année,
          name: line.Nom,
          firstName: line.Prénom,
          gender: line.Genre,
          jobName: line.Fonction,
          academicMembership: line.Unité,
          gradeAdmin: line['Grade académique'],
          organization: line.Tutelle,
          birthDate: line['Année naissance'],
          startDate: line['Entré(e) en']
        };

        if (line.Mail)
          info.contacts = {
            email: line.Mail
          };

        return info;
      },
      resolver(lines) {

        let persons = partitionBy(lines, hashPeople);

        // Sort by years
        persons = persons.map(years => {
          return _.sortBy(years, 'year');
        });

        const objects = persons.map(years => {
          const first = years[0],
                job = _.find(years.slice().reverse(), year => !!year.jobName),
                start = years.find(year => !!year.startDate);

          const person = {
            name: first.name,
            firstName: first.firstName,
            gender: first.gender,
            birthDate: first.birthDate
          };

          if (first.contacts)
            person.contacts = first.contacts;

          // So, here, we create a single position using the last job name
          // found, and then we create temporal grades.
          if (job) {
            person.positions = [{
              jobName: job.jobName,
              organization: job.organization
            }];

            if (start)
              person.positions[0].startDate = start.startDate;

            // Admin grades
            person.positions[0].gradesAdmin = partitionBy(years.filter(year => !!year.gradeAdmin), 'gradeAdmin')
              .map((slice, i, slices) => {
                const nextSlice = slices[i + 1];

                const info = {
                  grade: slice[0].gradeAdmin
                };

                if (!i && slice[0].startDate)
                  info.startDate = slice[0].startDate;
                else
                  info.startDate = slice[0].year;

                if (nextSlice && nextSlice[0])
                  info.endDate = nextSlice[0].year;

                return info;
              });
          }

          person.academicMemberships = partitionBy(years.filter(year => !!year.academicMembership), 'academicMembership')
            .map((slice, i, slices) => {
              const nextSlice = slices[i + 1];

              const info = {
                organization: slice[0].academicMembership
              };

              if (!i && slice[0].startDate)
                info.startDate = slice[0].startDate;
              else
                info.startDate = slice[0].year;

              if (nextSlice && nextSlice[0])
                info.endDate = nextSlice[0].year;

              return info;
            });

          return person;
        });

        return objects;
      },
      indexer(indexes, person) {

        // Here, we are trying to match someone in the previous SIRH file.
        // If we found one & we have a FNSP position, we add grade & email
        // If we found one & we haveg another position, we push position + grade + email
        // Else, we just insert the person.
        const key = hashPeople(person),
              match = indexes.hashed[key];

        if (match) {

          if (!person.positions)
            return;

          const org = person.positions[0].organization;

          if (org === 'FNSP') {

            match.positions.forEach(position => {

              // Finding the first overlapping grade
              const grades = _.filter(person.positions[0].gradesAdmin, g => {
                return overlap(
                  {
                    startDate: position.startDate.slice(0, 4),
                    endDate: position.endDate ? position.endDate.slice(0, 4) : null
                  },
                  g
                );
              });

              if (grades)
                position.gradesAdmin = grades;
            });
          }
          else {
            match.positions = match.positions.concat(person.positions);
          }

          // Overriding academic memberships
          if (person.academicMemberships)
            match.academicMemberships = person.academicMemberships;

          // Mail
          if (person.contacts)
            match.contacts = person.contacts;

          return;
        }

        indexes.hashed[key] = person;
        indexes.id[person._id] = person;
      }
    },

    /**
     * DS_academic.csv
     * -------------------------------------------------------------------------
     */
    {
      name: 'DS_academic',
      path: 'people/DS_academic.csv',
      delimiter: ',',
      consumer(line) {
        const info = {
          year: line.Année,
          name: line.Nom,
          firstName: line.Prénom,
          gender: line.GENRE,
          birthDate: line.Âge,
          jobTitle: line.Statut,
          organization: line.Tutelle
        };

        if (line.Mail)
          info.contacts = {
            email: line.Mail
          };

        if (line.Nationalité)
          info.nationalities = line.Nationalité.split(',');

        if (line['Entré(e) en'])
          info.startDate = line['Entré(e) en'].slice(0, 4);

        if (line.Grade) {
          if (/^appui/.test(info.jobTitle))
            info.gradeAdmin = line.Grade;
          else
            info.gradeAcademic = line.Grade;
        }

        if (line['Prime Incitation / Convergence']) {
          info.bonuses = line['Prime Incitation / Convergence']
            .split(';')
            .map(string => {
              const [startDate, endDate] = string.trim().split('-');

              const bonusType = info.organization === 'FNSP' ?
                'primeConvergence' :
                'primeIncitation';

              return {
                bonusType,
                startDate,
                endDate
              };
            });
        }

        if (line['Paysd\'obtentionduPhD'] || line['Année d\'obtention du PhD']) {
          const countries = line['Paysd\'obtentionduPhD'].split(',');

          info.distinctions = [{
            countries,
            distinctionType: 'diplôme',
            title: 'Doctorat'
          }];

          if (line['Année d\'obtention du PhD'])
            info.distinctions[0].date = line['Année d\'obtention du PhD'];

          if (line.PhdSciencesPo === 'oui')
            info.distinctions[0].organizations = ['IEP Paris'];
        }

        if (line['HDRouéquivalent']) {
          info.distinctions = info.distinctions || [];
          info.distinctions.push({
            distinctionType: 'diplôme',
            title: 'HDR'
          });
        }

        if (line.Dpmt) {
          info.deptMemberships = line.Dpmt
            .split(',')
            .map(dept => {
              return {
                organization: dept.trim()
              };
            });
        }

        if (line['Unité de recherche'] &&
            line['Unité de recherche'] !== 'Non affilié')
          info.academicMemberships = line['Unité de recherche']
            .split(',')
            .map(org => ({
              organization: org.trim(),
              membershipType: 'membre'
            }));

        if (line['Autres affiliations']) {
          info.academicMemberships = info.academicMemberships || [];
          info.academicMemberships.push.apply(
            info.academicMemberships,
            line['Autres affiliations']
              .split(',')
              .map(org => ({
                organization: org.trim(),
                membershipType: 'membre'
              }))
          );
        }

        return info;
      },
      resolver(lines) {

        // For unit information, find a line where the information is given
        // Need to chronologically order memberships
        let persons = partitionBy(lines, line => `${line.name}§${line.firstName}`);

        // Sort by years
        persons = persons.map(years => {
          return _.sortBy(years, 'year');
        });

        // Building objects
        const objects = persons.map(years => {
          const firstYear = years[0];

          const info = {
            name: firstYear.name,
            firstName: firstYear.firstName,
            contacts: firstYear.contacts
          };

          // Finding gender
          const genderYear = years.find(year => !!year.gender);

          if (genderYear)
            info.gender = genderYear.gender;

          // Finding nationalities
          const nationalitiesYear = years.find(year => !!(year.nationalities || []).length);

          if (nationalitiesYear)
            info.nationalities = nationalitiesYear.nationalities;

          // Finding birthDate
          const birthDateYear = years.find(year => !!year.birthDate);

          if (birthDateYear)
            info.birthDate = birthDateYear.birthDate;

          // Finding distinctions (get the year with most distinctions)
          const distinctionYear = _(years)
            .sortBy(year => -(year.distinctions || []).length)
            .first();

          if (distinctionYear.distinctions)
            info.distinctions = distinctionYear.distinctions;

          // Finding bonuses
          const bonusesYear = years.find(year => !!(year.bonuses || []).length);

          if (bonusesYear)
            info.bonuses = bonusesYear.bonuses;

          // Chronologies: positions, dpt, academic memberships
          const positionSlices = partitionBy(years, 'jobTitle');

          // Positions
          info.positions = positionSlices.map((slice, i) => {
            const nextSlice = positionSlices[i + 1];

            const jobInfo = {
              jobTitle: slice[0].jobTitle,
              organization: slice[0].organization
            };

            // Dates
            if (!i && slice[0].startDate)
              jobInfo.startDate = slice[0].startDate;
            else
              jobInfo.startDate = slice[0].year;

            if (nextSlice)
              jobInfo.endDate = nextSlice[0].startDate;

            // Grade Admin
            if (slice[0].gradeAdmin) {
              jobInfo.gradesAdmin = [
                {
                  grade: slice[0].gradeAdmin
                }
              ];

              if (jobInfo.startDate)
                jobInfo.gradesAdmin[0].startDate = jobInfo.startDate;
            }

            return jobInfo;
          });

          // Departement memberships
          info.deptMemberships = [];
          years
            .filter(year => !!year.deptMemberships)
            .forEach((year, i, relevantYears) => {

              year.deptMemberships.forEach(membership => {
                let relevantMembership = info.deptMemberships.find(m => m.organization === membership.organization);

                // If no relevant membership was found, we add it
                if (!relevantMembership) {
                  relevantMembership = {
                    organization: membership.organization,
                    startDate: !i && year.startDate ? year.startDate : year.year,
                    endDate: year.year
                  };

                  info.deptMemberships.push(relevantMembership);
                }

                // Else we update the endDate if not final year
                else if (relevantYears[i + 1]) {
                  relevantMembership.endDate = year.year;
                }

                else {
                  delete relevantMembership.endDate;
                }
              });
            });

          if (!info.deptMemberships.length)
            delete info.deptMemberships;

          // Academic memberships
          info.academicMemberships = [];
          years
            .filter(year => !!year.academicMemberships)
            .forEach((year, i, relevantYears) => {

              year.academicMemberships.forEach(membership => {
                let relevantMembership = info.academicMemberships.find(m => m.organization === membership.organization);

                // If no relevant membership was found, we add it
                if (!relevantMembership) {
                  relevantMembership = {
                    organization: membership.organization,
                    startDate: !i && year.startDate ? year.startDate : year.year,
                    endDate: year.year
                  };

                  info.academicMemberships.push(relevantMembership);
                }

                // Else we update the endDate if not final year
                else if (relevantYears[i + 1]) {
                  relevantMembership.endDate = year.year;
                }

                else {
                  delete relevantMembership.endDate;
                }
              });
            });

          if (!info.academicMemberships.length)
            delete info.academicMemberships;

          return info;
        });

        return objects;
      },
      indexer(indexes, person) {
        const key = hashPeople(person);

        // We attempt to match by hash
        const match = indexes.hashed[key];

        if (match) {

          // Overrides
          [
            'contacts',
            'nationalities',
            'bonuses',
            'distinctions',
            'deptMemberships',
            'academicMemberships'
          ].forEach(prop => {
            if (person[prop])
              match[prop] = person[prop];
          });

          return;
        }

        // Else we create the person
        indexes.hashed[key] = person;
        indexes.id[person._id] = person;
      }
    }
  ]
};
