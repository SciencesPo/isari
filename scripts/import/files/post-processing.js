/**
 * ISARI Post LDAP File Definitions
 * =================================
 *
 * Files needing to wait for LDAP resolution to be processed.
 */
const fingerprint = require('talisman/keyers/fingerprint'),
      helpers = require('../helpers'),
      hashPeople = helpers.hashPeople,
      chalk = require('chalk');

module.exports = {
  files: [

    /**
     * prix.csv
     * -------------------------------------------------------------------------
     */
    {
      name: 'prix',
      path: 'people/prix.csv',
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
      process(indexes, id, line) {
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

          const orgKey = fingerprint(line.organization);

          if (!org)
            org = indexes.Organization.fingerprint[orgKey];

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
            indexes.Organization.fingerprint[orgKey] = org;
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
    },

    /**
     * ID_scopus_orcid.csv
     * -------------------------------------------------------------------------
     */
    {
      name: 'ID_scopus_orcid',
      path: 'people/ID_scopus_orcid.csv',
      skip: true,
      consumer(line) {
        const info = {
          ldapUid: line['LDAP ID'],
          ORCID: line.ORCID,
          idScopus: line['main Scopus ID']
        };

        return info;
      },
      process(indexes, id, line) {

        // Matching the person
        const person = indexes.People.ldap[line.ldapUid];

        if (!person) {
          this.warning(`Could not match ${chalk.green(line.ldapUid)}.`);
          return false;
        }

        person.ORCID = line.ORCID;
        person.idScopus = line.idScopus;
      }
    },

    /**
     * admin_roles.csv
     * -------------------------------------------------------------------------
     */
    {
      name: 'admin_roles',
      path: 'people/admin_roles.csv',
      process(indexes, id, line) {
        const {ldapUid, orgaAcronym, isariRole} = line;

        const person = indexes.People.ldap[ldapUid];

        if (!person) {
          this.error(`Could not match person with LDAP id ${chalk.green(ldapUid)}.`);
          return false;
        }

        let org;

        if (orgaAcronym) {
          org = indexes.Organization.acronym[orgaAcronym.toUpperCase()];

          if (!org)
            org = indexes.Organization.name[orgaAcronym];

          if (!org) {
            this.error(`Could not match organization with acronym ${chalk.green(orgaAcronym)}`);
            return false;
          }
        }
        else if (!/^central_/.test(isariRole)) {
          this.error(`Inconsistent role for id ${chalk.green(ldapUid)}. Cannot be ${chalk.grey(isariRole)} and be attached to an organization.`);
          return false;
        }

        person.isariAuthorizedCenters = person.isariAuthorizedCenters || [];

        let authorization = org && person.isariAuthorizedCenters.find(a => a.organization === org._id);

        if (authorization) {
          authorization.isariRole = isariRole;
        }
        else {
          authorization = {isariRole};

          if (org)
            authorization.organization = org._id;

          person.isariAuthorizedCenters.push(authorization);
        }
      }
    }
  ]
};
