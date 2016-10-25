/**
 * ISARI Import Scripts File Definitions
 * ======================================
 *
 * Defining the various files to import as well as their line consumers.
 */
module.exports = {

  /**
   * Organization files.
   */
  organizations: {
    folder: 'organizations',
    files: [
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
            organizationTypes: [line.organizationType],
            parentOrganizations: line.parent_organisations ?
              [line.parent_organisations] :
              []
          };

          if (line.acronym)
            info.acronym = line.acronym;
          if (line.url)
            info.url = line.url;

          return info;
        },
        indexer(indexes, org) {
          if (org.acronym)
            indexes.Organization[org.acronym] = org;
          if (org.name)
            indexes.Organization[org.name] = org;
        }
      },

      // {
      //   name: 'research_units',
      //   path: 'sciencespo_research_units.csv',
      //   delimiter: ',',
      //   consumer(line) {

      //     // TODO: what if no research unit code?
      //     // TODO: this is no JSON
      //     let researchUnitCodes = [];

      //     if (line.researchunit_codes) {
      //       researchUnitCodes = JSON.parse(line.researchunit_codes);
      //     }

      //     researchUnitCodes.forEach(item => {
      //       item.start_date = item.startDate;
      //       delete item.start_date;
      //     });

      //     const info = {
      //       researchUnitCodes,
      //       name: line.name
      //     };

      //     if (line.acronym)
      //       info.acronym = line.acronym;

      //     return info;
      //   },
      //   indexer() {

      //   }
      // }
    ]
  }
};
