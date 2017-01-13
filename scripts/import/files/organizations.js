/**
 * ISARI Import Scripts Organizations File Definitions
 * ====================================================
 */
const fingerprint = require('talisman/keyers/fingerprint'),
      moment = require('moment'),
      ENUM_INDEXES = require('../indexes').ENUM_INDEXES,
      helpers = require('../helpers'),
      chalk = require('chalk'),
      partitionBy = helpers.partitionBy,
      _ = require('lodash');

module.exports = {
  files: [

    /**
     * default_organizations.csv
     * -------------------------------------------------------------------------
     */
    {
      name: 'default',
      path: 'organizations/default_organizations.csv',
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
          info.parentOrganizations = [line.parent_organisations];
        if (line.monitored)
          info.isariMonitored = true;

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
     * -------------------------------------------------------------------------
     */
    {
      name: 'research_units',
      path: 'organizations/sciencespo_research_units.csv',
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
          countries: ['FR'],
          isariMonitored: true
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
     * -------------------------------------------------------------------------
     */
    {
      name: 'organizations_hceres_banner_spire',
      path: 'organizations/organizations_hceres_banner_spire/organizations_hceres_banner_spire.csv',
      delimiter: ',',
      consumer(line) {
        const info = {
          source: line.Source,
          codeUAI: line['code UAI'],
          name: line.name,
          acronym: line.acronym,
          idBanner: line['ID Banner'],
          idSpire: line['SPIRE rec_id'],
          url: line.url,
          idHal: line.idHAL
        };

        if (line['Organisation Type (HCERES, SPIRE)'])
          info.organizationTypes = [line['Organisation Type (HCERES, SPIRE)']];

        if (line.HCERESOrganizationType)
          info.HCERESOrganizationType = line.HCERESOrganizationType;

        if (line['adresse banner'])
          info.address = line['adresse banner'];

        if (line['SPIRE adresse'])
          info.address = line['SPIRE adresse'];

        if (line['banner country alpha3']) {
          const match = ENUM_INDEXES.countries.alpha3[line['banner country alpha3']];

          if (!match)
            this.error(`Could not find the country for alpha3 "${line['banner country alpha3']}"`);
          else
            info.countries = [match.alpha2];
        }

        if (line['SPIRE country alpha2'])
          info.countries = [line['SPIRE country alpha2']];

        if (line['SPIRE ORGA Parent REC ID'])
          info.spireParent = line['SPIRE ORGA Parent REC ID'];

        info.researchUnitCodes = [];

        if (line.idMinistry)
          info.researchUnitCodes.push({code: line.idMinistry});
        if (line.idCNRS)
          info.researchUnitCodes.push({code: line.idCNRS});

        return info;
      },
      resolver(lines) {

        // Priority: HCERES > Banner > Spire
        return partitionBy(lines, line => `${line.acronym}§${line.name}`)
          .map(sourceLines => {
            if (sourceLines.length > 3)
              this.error(`Too many different sources for organization: "${sourceLines[0].name}".`);

            const sources = _.keyBy(sourceLines, 'source');

            const merged = Object.assign({},
              sources.HCERES || {},
              sources.Banner || {},
              sources.SPIRE || {},
              sources.byhand || {}
            );

            delete merged.idBanner;
            delete merged.idSpire;

            // Multiplexed ids
            const idsBanner = _(sourceLines)
              .filter(line => !!line.idBanner)
              .map('idBanner')
              .uniq()
              .value();

            if (idsBanner.length)
              merged.idsBanner = idsBanner;

            const idsSpire = _(sourceLines)
              .filter(line => !!line.idSpire)
              .map('idSpire')
              .uniq()
              .value();

            if (idsSpire)
              merged.idsSpire = idsSpire;

            // Unit codes
            const codes = new Set();

            for (const k in sources) {
              if (sources[k].researchUnitCodes)
                sources[k].researchUnitCodes
                  .forEach(ruc => (codes.add(ruc.code)));
            }

            merged.researchUnitCodes = Array.from(codes).map(code => ({code}));

            return merged;
          });
      },
      indexer(indexes, org) {

        // Attempting to find the organization
        let match = indexes.name[org.name];

        if (!match && org.acronym)
          match = indexes.acronym[org.acronym];

        const key = fingerprint(org.name);

        if (!match) {
          match = indexes.fingerprint[key];

          if (match)
            this.warning(`Matched "${chalk.green(org.name)}" with "${chalk.green(match.name)}".`);
        }

        if (match) {

          // Merging...
          [
            'codeUAI',
            'idsBanner',
            'idsSpire',
            'idHal',
            'HCERESOrganizationType'
          ].forEach(prop => {
            if (org[prop])
              match[prop] = org[prop];
          });

          if (match.idsBanner)
            match.idsBanner.forEach(id => (indexes.banner[id] = match));

          return;
        }

        // Does not exist yet, let's add it
        indexes.id[org._id] = org;
        indexes.name[org.name] = org;
        indexes.fingerprint[key] = org;

        if (org.acronym)
          indexes.acronym[org.acronym] = org;

        if (org.idsBanner)
          org.idsBanner.forEach(id => (indexes.banner[id] = org));
      }
    }
  ]
};
