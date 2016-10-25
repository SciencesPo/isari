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
          return {
            name: line.name,
            acronym: line.acronym || null,
            address: line.address,
            country: line.country,
            status: line.status,
            organizationTypes: [line.organizationType],
            url: line.url || null,
            parentOrganizations: line.parent_organisations ?
              [line.parent_organisations] :
              []
          };
        }
      },
      // {
      //   name: 'researchUnits'
      //   path: 'sciencespo_research_units.csv'
      // }
    ]
  }
};
