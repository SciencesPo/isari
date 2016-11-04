/**
 * ISARI Import Scripts File Definitions
 * ======================================
 *
 * Defining the various files to import as well as their line consumers.
 */
const moment = require('moment'),
      chalk = require('chalk'),
      fingerprint = require('talisman/keyers/fingerprint').default,
      _ = require('lodash');

const ENUM_INDEXES = require('./indexes.js').ENUM_INDEXES;

/**
 * Overriding some Moment.js things for convenience.
 */
moment.prototype.inspect = function() {
  return 'Moment{' + this.format('YYYY-MM-DD') + '}';
};
moment.prototype.toString = moment.prototype.inspect;

/**
 * Helpers.
 */
function partitionBy(collection, predicate) {
  return _.values(_.groupBy(collection, predicate));
}

function normalizeName(name) {
  return _.deburr(name)
    .toUpperCase()
    .replace(/-/g, ' ');
}

function hashPeople(p) {
  const name = normalizeName(p.name),
        firstName = normalizeName(p.firstName);

  if (p.birthDate)
    return `${name}§${firstName}§${(p.birthDate || '').slice(0, 4)}`;
  else
    return `${name}§${firstName}`;
}

function overlap(A, B) {
  if (!A.endDate && !B.endDate)
    return true;
  if (A.endDate > B.startDate)
    return true;
  if (A.startDate < B.startDate && A.endDate > B.endDate)
    return true;
  return false;
}

/**
 * File definitions.
 */
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
            countries: [line.country],
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

          if (org.name) {
            indexes.name[org.name] = org;
            indexes.fingerprint[fingerprint(org.name)] = org;
          }

          indexes.id[org._id] = org;
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
            status: line.status,
            countries: ['FR']
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

          if (org.name) {
            indexes.name[org.name] = org;
            indexes.fingerprint[fingerprint(org.name)] = org;
          }

          indexes.id[org._id] = org;
        }
      },

      /**
       * organizations_hceres_banner_spire.csv
       */
      {
        name: 'organizations_hceres_banner_spire',
        path: 'organizations_hceres_banner_spire.csv',
        delimiter: ',',
        skip: true,
        consumer(line) {
          const info = {
            source: line.Source,
            HCERESorganizationType: line['TAGS HCERES'],
            codeUAI: line['code UAI'],
            acronym: line.Sigle,
            name: line['Nom d\'usage 1'],
            country: line['Country ISO'],
            idBanner: line['ID Banner'],
            address: line['ADRESSE BANNER'] || line['ADRESSE SPIRE'],
            idSpire: line['SPIRE rec_id'],
            organizationType: line['organizationType (ENUMS)'],
            parentOrganization: line['SPIRE ORGA Parent REC ID'],
            researchUnitCodes: [],
            idHal: line['SPIRE ID hal']
          };

          if (line['Country ISO'])
            line.countries = [line['Country ISO']];

          if (line['SPIRE ID cnrs'])
            info.researchUnitCodes.push({code: line['SPIRE ID cnrs']});

          if (line['SPIRE ID ministry'])
            info.researchUnitCodes.push({code: line['SPIRE ID ministry']});

          return info;
        },
        resolver(lines) {

          // Here we're gonna merge lines internally to this file
          // TODO: choose the keying method
          const organizations = partitionBy(lines, line => `${line.acronym}§${line.name}`);

          // 1) country européen
          // 2) intra banner duplicates
          // 3) intra spire duplicates
          let pb = organizations.filter(o => partitionBy(o, 'source').some(s => s.length > 1));
          console.log(organizations.length - pb.length);

          // require('fs').writeFileSync('pb.json', JSON.stringify(pb, null, 2));

          // console.log(organizations.filter(o => o.filter(i => i.source === 'Banner').length > 1).length)

          return lines;
        },
        indexer() {

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
                jobName: contract.jobName,
                jobType: contract.jobType,
                timepart: contract.timepart
              };

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
          indexes.fuzzySirh[hashPeople(person)] = person;
        }
      },

      /**
       * DS_admtech.csv
       */
      {
        name: 'DS_admtech',
        path: 'DS_admtech.csv',
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
                  job = _.find(_.reverse(years), year => !!year.jobName);

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
                organization: job.organization,
                startDate: job.startDate
              }];

              // Admin grades
              person.positions[0].gradesAdmin = partitionBy(years.filter(year => !!year.gradeAdmin), 'gradeAdmin')
                .map((slice, i, slices) => {
                  const nextSlice = slices[i + 1];

                  const info = {
                    grade: slice[0].gradeAdmin
                  };

                  if (!i)
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

                if (!i)
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
          // If we found one & we hava another position, we push position + grade + email
          // Else, we just insert the person.
          const fuzzyKey = hashPeople(person),
                match = indexes.fuzzySirh[fuzzyKey];

          if (match && !!person.positions) {
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
              match.positions.push(person.positions);
            }

            if (person.contacts)
              match.contacts = person.contacts;

            return;
          }

          indexes.id[person._id] = person;
        }
      },

      /**
       * DS_academic.csv
       */
      {
        name: 'DS_academic',
        path: 'DS_academic.csv',
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

                return {
                  bonusType: 'primeConvergence',
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

            if (line['PhdSciencesPo'] === 'oui')
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

          if (line['Unité de recherche'])
            info.academicMemberships = [{
              organization: line['Unité de recherche'],
              membershipType: 'membre'
            }];

          if (line['Autres affiliations']) {
            info.academicMemberships = info.academicMemberships || [];
            info.academicMemberships.push({
              organization: line['Autres affiliations'],
              membershipType: 'membre'
            });
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

            // Finding birthDate
            const birthDateYear = years.find(year => !!year.birthDate);

            if (birthDateYear)
              info.birthDate = birthDateYear.birthDate;

            // Finding distinctions (get the year with most distinctions)
            const distinctionYear = _(years)
              .sortBy(year => year.distinctions && year.distinctions.length)
              .first();

            if (distinctionYear.distinctions)
              info.distinctions = distinctionYear.distinctions;

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
              if (!i)
                jobInfo.startDate = slice[0].startDate;
              else
                jobInfo.startDate = slice[0].year;

              if (nextSlice)
                jobInfo.endDate = nextSlice[0].startDate;

              // Grade Admin
              if (slice[0].gradeAdmin) {
                jobInfo.gradesAdmin = [
                  {
                    grade: slice[0].gradeAdmin,
                    startDate: jobInfo.startDate
                  }
                ];
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
                  if (!relevantMembership) {
                    relevantMembership = {
                      organization: membership.organization,
                      startDate: !i ? year.startDate : year.year,
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
                  if (!relevantMembership) {
                    relevantMembership = {
                      organization: membership.organization,
                      startDate: !i ? year.startDate : year.year,
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
        indexer() {

          // TODO: index & merge!
        }
      },

      /**
       * BANNER_DOCTORANT_HDR.csv
       */
      {
        name: 'BANNER_DOCTORANT_HDR',
        path: 'banner/BANNER_DOCTORANT_HDR.csv',
        delimiter: ',',
        skip: true,
        consumer(line) {
          const info = {
            bannerUid: line.ID,
            birthDate: moment(line.DATE_NAISSANCE, 'DD/MM/YYYY').format('YYYY-MM-DD'),
            sirhMatricule: line.MATRICULE_PAIE
          };

          const [name, firstName] = line.NOM_COMPLET.split(',');

          info.name = name.trim();
          info.firstName = firstName.trim();

          if (line.EMAIL)
            info.contacts = {
              email: line.EMAIL
            };

          if (line.CODE_NATIONALITE)
            info.nationalities = [line.CODE_NATIONALITE];

          if (line.LIB_SEXE === 'Mr' || line.LIB_SEXE === 'Monsieur')
            info.gender = 'm';
          else
            info.gender = 'f';

          return info;
        },
        resolver(lines) {

          // Lines are unique, except for persons having both PhD & HDR
          // console.log(lines);
          return [];
        },
        indexer() {

        }
      }
    ]
  },

  /**
   * Activitiy Files.
   * ---------------------------------------------------------------------------
   */
  activities: {
    folder: 'activities',
    files: [

      /**
       * invites.csv
       */
      {
        name: 'invites',
        path: 'invites.csv',
        delimiter: ',',
        consumer(line) {
          const info = {
            source: line.Source,
            organization: line['Orga qui accueille'],
            name: line['Nom Invité'],
            firstName: line['Prénom Invité'],
            nationality: line['Nationalité Invité'],
            gradeAcademic: line.Statut,
            subject: line['Sujet de recherche'],
            course: line.Cours,
            discipline: line.Discipline,
            origin: line['Etablissement d\'origine'],
            originParent: line['Orga d\'origine PARENT'],
            originCountry: line.Pays,
            originCity: line.Ville,
            type: line['Type de séjour'],
            financing: line['Type de financement '],
            startDate: line['Date début'],
            endDate: line['Date fin'],
            inviting: line['Invitant/Contact']
          };

          if (line['email adress'])
            info.contacts = {
              email: line['email adress']
            };

          return info;
        },
        resolver(lines) {

          // 1) Generating people
          const people = {};

          partitionBy(lines, hashPeople)
            .forEach(personLines => {
              const firstLine = personLines[0];

              const peopleInfo = {
                name: firstLine.name,
                firstName: firstLine.firstName
              };

              // Contact
              const contactLine = personLines.find(line => !!line.contacts);

              if (contactLine)
                peopleInfo.contacts = contactLine.contacts;

              // Nationality
              const nationalityLine = personLines.find(line => !!line.nationality);

              if (nationalityLine)
                peopleInfo.nationalities = [nationalityLine.nationality];

              // Grade
              const gradeLine = personLines.find(line => !!line.gradeAcademic);

              if (gradeLine) {
                peopleInfo.gradesAcademic = [{grade: gradeLine.gradeAcademic}];

                peopleInfo.academicMemberships = [{
                  organization: gradeLine.origin,
                  membershipType: 'membre'
                }];
              }

              // Discipline
              const disciplineLine = personLines.find(line => !!line.discipline);

              if (disciplineLine)
                peopleInfo.tags = {
                  free: [disciplineLine.discipline]
                };

              people[hashPeople(firstLine)] = peopleInfo;
            });

          // 2) Generating organizations
          const organizations = {};

          // NOTE: normally, we already have the target organization.
          // partitionBy(lines, 'organization')
          //   .forEach(organizationLines => {
          //     const org = organizationLines[0].organization;

          //     organizations[org] = {
          //       name: org
          //     };
          //   });

          partitionBy(lines.filter(line => !!line.origin), 'origin')
            .forEach(organizationLines => {
              const org = organizationLines[0].origin;

              const orgInfo = {
                name: org
              };

              // Parent
              const parentLine = organizationLines.find(line => !!line.originParent);

              if (parentLine)
                orgInfo.parentOrganizations = [
                  parentLine.originParent
                ];

              // Country
              const countryLine = organizationLines.find(line => !!line.originCountry);

              if (countryLine)
                orgInfo.countries = [countryLine.originCountry];

              // Address
              const cityLine = organizationLines.find(line => !!line.originCity);

              if (cityLine)
                orgInfo.address = cityLine.originCountry;

              organizations[org] = orgInfo;
            });

          // 3) Generating activities
          // NOTE: don't forget phantom organization if !origin && country
          // (address would be the city if we have it)


          // TODO: phantom enum type

          // TODO: create unique unknow org in some cases
          // TODO: generate activity type

          return {
            People: _.values(people),
            Organization: _.values(organizations)
          };
        },
        indexer() {

        }
      }
    ]
  }
};
