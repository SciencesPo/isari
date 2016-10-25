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

          return line;
        },
        indexer(indexes, org) {
          if (org.acronym)
            indexes.Organization[org.acronym] = org;
          if (org.name)
            indexes.Organization[org.name] = org;
        }
      }
    ]
  }
};
