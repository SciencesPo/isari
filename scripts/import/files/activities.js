/**
 * ISARI Import Scripts Activities File Definitions
 * =================================================
 */
const fingerprint = require('talisman/keyers/fingerprint').default,
      chalk = require('chalk'),
      moment = require('moment'),
      helpers = require('../helpers'),
      partitionBy = helpers.partitionBy,
      hashPeople = helpers.hashPeople,
      _ = require('lodash');

module.exports = {
  files: [

    /**
     * invites.csv
     * -------------------------------------------------------------------------
     */
    {
      name: 'invites',
      path: 'activities/invites.csv',
      delimiter: ',',
      consumer(line) {
        const info = {
          source: line.Source,
          organizations: line['Orga qui accueille']
            .split(',')
            .map(org => org.trim()),
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

        partitionBy(lines.filter(line => !!line.origin), 'origin')
          .forEach(organizationLines => {
            const org = organizationLines[0].origin;

            const orgInfo = {
              name: org
            };

            // Parent
            const parentLine = organizationLines.find(line => !!line.originParent);

            if (parentLine) {
              orgInfo.parentOrganizations = [
                parentLine.originParent
              ];

              // Adding the parent organization just in case
              if (!organizations[parentLine.originParent])
                organizations[parentLine.originParent] = {
                  name: parentLine.originParent
                };
            }

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
        const activities = lines.map(line => {

          // People
          const personKey = hashPeople(line),
                person = people[personKey];

          const activityInfo = {
            activityType: 'mob_entrante',
            name: `Invité: ${person.firstName} ${person.name}`,
            organizations: [],
            people: [{
              people: personKey
            }]
          };

          // TODO: add a role

          if (line.startDate)
            activityInfo.people[0].startDate = line.startDate;
          if (line.endDate)
            activityInfo.people[0].endDate = line.endDate;

          // Target organization
          if (line.organizations) {
            line.organizations.forEach(org => {
              const linkInfo = {
                organization: org,
                role: 'orgadaccueil'
              };

              if (line.startDate)
                linkInfo.startDate = line.startDate;
              if (line.endDate)
                linkInfo.endDate = line.endDate;

              activityInfo.organizations.push(linkInfo);
            });
          }

          // Origin organization
          if (line.origin) {
            const linkInfo = {
              organization: line.origin,
              role: 'orgadorigine'
            };

            if (line.startDate)
              linkInfo.startDate = line.startDate;
            if (line.endDate)
              linkInfo.endDate = line.endDate;

            activityInfo.organizations.push(linkInfo);
          }

          // Phantom organization
          if (!line.origin && !!line.originCountry) {
            const name = `Invité - Organisation inconnue (${line.originCountry})`;

            const org = {name};
            organizations[name] = org;

            const linkInfo = {
              organization: name,
              role: 'orgadorigine',
              organizationTypes: ['inconnue']
            };

            if (line.startDate)
              linkInfo.startDate = line.startDate;
            if (line.endDate)
              linkInfo.endDate = line.endDate;

            activityInfo.organizations.push(linkInfo);
          }

          // Subject
          const subject = [];

          if (line.subject)
            subject.push(`Sujet de recherche : ${line.subject}`);
          if (line.course)
            subject.push(`Cours : ${line.course}`);
          if (line.type)
            subject.push(`Type de séjour : ${line.type}`);

          if (subject.length)
            activityInfo.subject = subject.join(' ');

          // Summary
          const summary = [];

          if (line.inviting)
            summary.push(`Contact/Invitant : ${line.inviting}`);
          if (line.financing)
            summary.push(`Type de financement : ${line.financing}`);

          if (summary.length)
            activityInfo.summary = summary.join(' ');

          return activityInfo;
        });

        return {
          People: _.values(people),
          Organization: _.values(organizations),
          Activity: activities
        };
      },
      indexers: {
        Organization(indexes, org) {

          // Attempting to match the organization
          let match = indexes.name[org.name];

          if (match)
            return;

          const key = fingerprint(org.name);

          match = indexes.fingerprint[key];

          if (match) {

            this.warning(`Matched "${chalk.green(org.name)}" with "${chalk.green(match.name)}".`);
            return;
          }

          indexes.fingerprint[key] = org;
          indexes.name[org.name] = org;
          indexes.id[org._id] = org;
        },
        People(indexes, person) {
          const key = hashPeople(person);

          // TODO: be sure we don't have to match people here
          indexes.id[person._id] = person;
          indexes.hashed[key] = person;
        },
        Activity(indexes, activity) {
          indexes.id[activity._id] = activity;
        }
      }
    },

    /**
     * BANNER_DOCTORANT_HDR.csv
     * -------------------------------------------------------------------------
     */
    {
      name: 'BANNER_DOCTORANT_HDR',
      path: 'people/banner/BANNER_DOCTORANT_HDR.csv',
      delimiter: ',',
      peopleFile: true,
      consumer(line) {
        const info = {
          bannerUid: line.ID,
          birthDate: moment(line.DATE_NAISSANCE, 'DD/MM/YYYY').format('YYYY-MM-DD'),
          sirhMatricule: line.MATRICULE_PAIE,
          discipline: line.DISCIPLINE,
          hdr: line.CODE_NIVEAU === '9'
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

        // Retrieving jury members:
        const jury = [];

        for (let i = 1; i < 11; i++) {
          const fullName = line['MEMBRE_JURY_' + i];

          if (!fullName)
            break;

          const [name, firstName] = fullName.split(',');

          const juryMember = {
            name: name.trim(),
            firstName: firstName.trim()
          };

          if (line['FONCTION_MEMBRE_JURY_' + i])
            juryMember.quality = line['FONCTION_MEMBRE_JURY_' + i];

          if (line[`MEMBRE_JURY_${i}_PR_IND`] === 'Oui')
            juryMember.president = true;

          if (line[`MEMBRE_JURY_${i}_DT_IND`] === 'Oui')
            juryMember.director = true;

          if (line[`MEMBRE_JURY_${i}_RA_IND`] === 'Oui')
            juryMember.reporter = true;

          jury.push(juryMember);
        }

        info.jury = jury;

        // Retrieving directors
        const directors = [];

        for (let i = 1; i < 3; i++) {
          const fullName = line['DIR_THESE_' + i];

          if (!fullName)
            break;

          const [name, firstName] = fullName.split(',');

          const director = {
            name: name.trim(),
            firstName: firstName.trim()
          };

          if (line['TYP_DIR_THESE_' + i] === 'Co-directeur de thèse')
            director.co = true;

          directors.push(director);
        }

        info.directors = directors;

        return info;
      },
      resolver(lines) {
        const people = Object.create(null),
              activities = [];

        // We must group lines per person
        partitionBy(lines, 'bannerUid')
          .forEach(personLines => {
            const phd = personLines.find(person => !person.hdr),
                  hdr = personLines.find(person => person.hdr),
                  ref = phd || hdr;

            if (personLines.length > 2)
              this.warning(`Found ${personLines.length} lines for "${chalk.green(ref.firstName + ' ' + ref.name)}".`);

            const peopleInfo = {
              bannerUid: ref.bannerUid,
              birthDate: ref.birthDate,
              name: ref.name,
              firstName: ref.firstName,
              gender: ref.gender
            };

            if (ref.sirhMatricule)
              peopleInfo.sirhMatricule = ref.sirhMatricule;

            if (ref.contacts)
              peopleInfo.contacts = ref.contacts;

            if (ref.nationalities)
              peopleInfo.nationalities = ref.nationalities;

            // Adding people to the local index
            people[hashPeople(peopleInfo)] = peopleInfo;

            // Adding jury & directors to the local index
            ((phd || {}).jury || [])
              .concat((hdr || {}).jury || [])
              .concat((phd || {}).directors || [])
              .concat((hdr || {}).directors || [])
              .forEach(member => {
                const memberInfo = {
                  name: member.name,
                  firstName: member.firstName
                };

                const key = hashPeople(memberInfo);

                if (!people[key])
                  people[key] = memberInfo;
              });

            // Creating activities
            if (phd) {
              const activity = {};
            }
          });

        // TODO: compute activities from there

        return {
          People: _.values(people),
          Activity: activities
        };
      },
      indexers: {
        People(indexes, person) {
          const key = hashPeople(person);

          let match;

          // First, we try to match through SIRH
          if (person.sirhMatricule)
            match = indexes.sirh[person.sirhMatricule];

          // Else we attempt the hash
          if (!match)
            match = indexes.hashed[key];

          if (match) {

            // TODO: merge
            return;
          }

          // Else we index the people
          if (person.sirhMatricule)
            indexes.sirh[person.sirhMatricule] = person;
          indexes.hashed[key] = person;
          indexes.id[person._id] = person;
        },
        Activity() {

        }
      }
    },

    /**
     * prix.csv
     * -------------------------------------------------------------------------
     */
    {
      name: 'prix',
      path: 'activities/prix.csv',
      delimiter: ',',
      consumer(line) {
        const info = {
          organization: line['Nom Orga'],
          acronym: line.acronym,
          name: line.Nom,
          firstName: line.Prénom,
          title: line['Dénomination du prix'],
          date: line.Année,
          countries: line['Pays ISO'].split(',').map(c => c.trim())
        };

        return info;
      },
      overloader(indexes, id, line) {
        const key = hashPeople(line);

        // Matching the person
        const person = indexes.People.hashed[key];

        if (!person) {
          this.warning(`Could not match ${chalk.green(line.firstName + ' ' + line.name)}.`);
          return false;
        }

        // Checking whether the organization exists
        let org;

        if (line.organization) {
          org = indexes.Organization.name[line.organization];

          if (!org)
            org = indexes.Organization.acronym[line.acronym];

          const key = fingerprint(line.organization);

          if (!org)
            org = indexes.Organization.fingerprint[key];

          if (!org) {

            // We therefore create it
            org = {
              _id: id(),
              name: line.organization,
              countries: line.countries
            };

            if (line.acronym)
              org.acronym = line.acronym;

            indexes.Organization.name[org.name] = org;
            indexes.Organization.fingerprint[key] = org;
            indexes.Organization.id[org._id] = org;
          }
        }

        // Building the distinction
        const distinction = {
          distinctionType: 'distinction',
          countries: line.countries,
          title: line.title
        };

        if (org)
          distinction.organizations = [org.name];

        if (line.date)
          distinction.date = line.date;

        person.distinctions = person.distinctions || [];
        person.distinctions.push(distinction);

        return true;
      }
    }
  ]
};
