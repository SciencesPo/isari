/**
 * ISARI Import Scripts File Definitions
 * ======================================
 *
 * Defining the various files to import as well as their line consumers.
 */
const moment = require('moment'),
      chalk = require('chalk');

const ENUM_INDEXES = require('./indexes.js').ENUM_INDEXES;

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
            year: +line.Année,
            name: line['Nom usuel'],
            firstName: line.Prénom,
            birthName: line['Nom de naissance'],
            sirhMatricule: line.Matricule,
            birthDate: line['Date de naissance'],
            gender: line.gender,
            startDate: line['Date de début'],
            jobType: line['Type de contrat'],
            gradeSirh: line['Code_Emploi Repère'],
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

          if (line['Date fin présumée'])
            endDate = line['Date fin présumée'];
          else if (line['Date de sortie adm'])
            endDate = line['Date de sortie adm'];

          if (endDate)
            info.endDate = endDate;

          return info;
        }
      }
    ]
  }
};
