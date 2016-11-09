/**
 * ISARI Import Scripts Activities File Definitions
 * =================================================
 */
const fingerprint = require('talisman/keyers/fingerprint').default,
      helpers = require('../helpers'),
      partitionBy = helpers.partitionBy,
      hashPeople = helpers.hashPeople,
      _ = require('lodash');

module.exports = {
  folder: 'activities',
  files: [

    /**
     * invites.csv
     * -------------------------------------------------------------------------
     */
    {
      name: 'invites',
      path: 'invites.csv',
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

            this.warning(`Matched "${chalk.green(org.name)}" with "${chalk.green(match.name)}".`)
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
    }
  ]
};
