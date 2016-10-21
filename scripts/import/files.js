/**
 * ISARI Import Scripts File Definitions
 * ======================================
 *
 * Defining the various files to import as well as their line consumers.
 */
module.exports = {
  organizations: {
    folder: 'organisations',
    files: [
      {
        name: 'default_organizations.csv',
        separator: ',',
        consumer(line) {
          return {
            name: line.name,
            acronym: line.acronym || null,
            UG: line.UG,
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
      {
        name: 'sciencespo_research_units.csv'
      }
    ]
  }
};
