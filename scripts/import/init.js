/**
 * ISARI Init Import Script
 * =========================
 *
 * Script loading the initial data for ISARI by merging various data sources
 * such as CSV files and converting them to be inserted into the Mongo
 * database.
 */
const async = require('async'),
      csv = require('csv'),
      fs = require('fs'),
      path = require('path'),
      yargs = require('yargs'),
      mongoose = require('../../server/node_modules/mongoose'),
      inspect = require('util').inspect,
      chalk = require('chalk'),
      _ = require('lodash');

const FILES = require('./files'),
      clean = require('./clean'),
      helpers = require('./helpers'),
      log = require('./logger')();

// Skipping some files
FILES.organizations.files = FILES.organizations.files.filter(file => !file.skip);
FILES.people.files = FILES.people.files.filter(file => !file.skip);
FILES.activities.files = FILES.activities.files.filter(file => !file.skip);

if (inspect.defaultOptions)
  inspect.defaultOptions.depth = null;

// Altering the NODE_CONFIG_DIR env variable so that `config` can resolve
process.env.NODE_CONFIG_DIR = path.join(__dirname, '..', '..', 'server', 'config');

const ldapConfig = require('../../server/node_modules/config').ldap,
      ldapClient = require('ldapjs').createClient({url: ldapConfig.url});

const {
  connect,
  People,
  Organization,
  Activity
} = require('../../server/lib/model');

const models = {
  People,
  Organization,
  Activity
};

// Removing some required fields to ease validation process
People.schema.remove('latestChangeBy');
Organization.schema.remove('latestChangeBy');
Activity.schema.remove('latestChangeBy');

// Creating relations iteration helpers
const relations = {
  Organization: helpers.processRelations.bind(null,
    helpers.findRelations(Organization.schema)
  ),
  People: helpers.processRelations.bind(null,
    helpers.findRelations(People.schema)
  ),
  Activity: helpers.processRelations.bind(null,
    helpers.findRelations(Activity.schema)
  )
};

/**
 * Command line & constants.
 * -----------------------------------------------------------------------------
 */

/**
 * Reading command line.
 */
const argv = yargs
  .usage('$0 --path ./path/to/isari_data')
  .option('path', {
    demand: true
  })
  .option('dry-run', {
    type: 'boolean',
    default: false,
    describe: 'Whether to perform a dry run.'
  })
  .option('json', {
    describe: 'JSON dump path.'
  })
  .option('skip-ldap', {
    type: 'boolean',
    default: false,
    describe: 'Whether to skip LDAP resolution.'
  })
  .help()
  .argv;

/**
 * Indexes.
 */
const INDEXES = {
  Organization: {
    acronym: Object.create(null),
    name: Object.create(null),
    fingerprint: Object.create(null),
    id: Object.create(null)
  },
  People: {
    id: Object.create(null),
    hashed: Object.create(null)
  },
  Activity: {
    id: Object.create(null)
  }
};

const counter = {
  Organization() {
    return Object.keys(INDEXES.Organization.id).length;
  },
  People() {
    return Object.keys(INDEXES.People.id).length;
  },
  Activity() {
    return Object.keys(INDEXES.Activity.id).length;
  }
};

/**
 * State.
 */
let CONNECTION = null,
    NB_VALIDATION_ERRORS = 0,
    NB_RELATION_ERRORS = 0,
    NB_FILES = 0;

/**
 * Helpers.
 * -----------------------------------------------------------------------------
 */

// Function taking a parsed CSV line and cleaning it.
function cleanLine(line) {
  for (const k in line)
    line[k] = clean.default(line[k]);
}

// Function attributing a mongo id to an arbitrary item
function attachMongoId(item) {
  item._id = mongoose.Types.ObjectId();
}

// Function taking a file descriptor and returning the parsed lines
function parseFile(folder, file, callback) {
  const filePath = path.join(
    argv.path,
    folder,
    file.path
  );

  NB_FILES++;

  console.log();
  log.info(`Reading ${chalk.grey(filePath)}`);

  const options = {
    delimiter: file.delimiter,
    columns: true
  };

  const data = fs.readFileSync(filePath, 'utf-8');

  return csv.parse(data, options, (err, lines) => {
    if (err)
      return callback(err);

    log.info(`Parsed ${chalk.cyan(lines.length)} lines.`);

    // Cleaning the lines
    lines.forEach(cleanLine);

    // Consuming the lines
    lines = lines.map(file.consumer.bind(log));

    // Dropping null values
    lines.forEach((line, index) => {
      for (const k in line) {
        const value = line[k];

        if (
          value === null ||
          value === undefined ||
          value === '' ||
          Array.isArray(value) && !value.length
        )
          delete line[k];

        if (Number.isNaN(value))
          log.error(`Line ${index + 1}: NaN value for ${chalk.cyan(k)}`);
      }
    });

    return callback(null, lines);
  });
}

// Function using the Mongoose models to validate an entity
function validate(Model, line, index) {
  const result = (new Model(line, false)).validateSync(),
        errors = [];

  if (!result)
    return errors;

  return helpers.collectErrors(result, index);
}

/**
 * Tasks (Organizations, People, Activities)
 * -----------------------------------------------------------------------------
 */

/**
 * Processing organization files.
 */
const organizationTasks = FILES.organizations.files.map(file => next => {
  if (file.skip)
    return next();

  parseFile(FILES.organizations.folder, file, (err, lines) => {
    if (err)
      return next(err);

    // Optionally resolving
    if (file.resolver)
      lines = file.resolver.call(log, lines);

    log.info(`Extracted ${chalk.cyan(lines.length)} organizations.`);

    // Giving unique identifier
    lines.forEach(attachMongoId);

    // Validating
    lines.forEach((line, i) => {
      const errors = validate(Organization, line, i);

      errors.forEach(error => {
        log.error(error.formattedMessage, error);
      });

      NB_VALIDATION_ERRORS += errors.length;
    });

    // Indexing
    const before = counter.Organization();
    lines.forEach(file.indexer.bind(log, INDEXES.Organization));
    const after = counter.Organization(),
          added = after - before;

    log.info(`Added ${chalk.cyan(added)} unique organizations (matches: ${chalk.cyan(lines.length - added)}, total: ${chalk.cyan(after)}).`);

    return next();
  });
});

/**
 * Processing people files.
 */
const peopleTasks = FILES.people.files.map(file => next => {
  parseFile(FILES.people.folder, file, (err, lines) => {
    if (err)
      return next(err);

    const persons = file.resolver.call(log, lines);

    log.info(`Extracted ${chalk.cyan(persons.length)} persons.`);

    // Validating
    persons.forEach((person, i) => {
      const errors = validate(People, person, i);

      errors.forEach(error => {
        log.error(error.formattedMessage, error);
      });

      NB_VALIDATION_ERRORS += errors.length;
    });

    // Giving unique identifier
    persons.forEach(attachMongoId);

    // Indexing
    const before = counter.People();
    persons.forEach(file.indexer.bind(log, INDEXES.People));
    const after = counter.People(),
          added = after - before;

    log.info(`Added ${chalk.cyan(added)} unique people (matches: ${chalk.cyan(persons.length - added)}, total: ${chalk.cyan(after)}).`);

    return next();
  });
});

/**
 * Processing activity files.
 */
const activityTasks = FILES.activities.files.map(file => next => {
  parseFile(FILES.activities.folder, file, (err, lines) => {
    if (err)
      return next(err);

    const items = file.resolver.call(log, lines);

    if (items.Organization && items.Organization.length)
      log.info(`Extracted ${chalk.cyan(items.Organization.length)} organizations.`);

    if (items.People && items.People.length)
      log.info(`Extracted ${chalk.cyan(items.People.length)} persons.`);

    if (items.Activity && items.Activity.length)
      log.info(`Extracted ${chalk.cyan(items.Activity.length)} activities.`);

    // Validating
    for (const Model in items) {
      items[Model].forEach((item, i) => {
        const errors = validate(models[Model], item, i);

        errors.forEach(error => {
          log.error(error.formattedMessage, error);
        });

        NB_VALIDATION_ERRORS += errors.length;
      });
    }

    // Giving unique identifier
    for (const Model in items)
      items[Model].forEach(attachMongoId);

    // Indexing
    for (const Model in items) {
      if (file.indexers[Model]) {
        const before = counter[Model]();
        items[Model].forEach(file.indexers[Model].bind(log, INDEXES[Model]));
        const after = counter[Model](),
              added = after - before;

        log.info(`Added ${chalk.cyan(added)} unique ${Model.toLowerCase()} (matches: ${chalk.cyan(items[Model].length - added)}, total: ${chalk.cyan(after)}).`);
      }
    }

    return next();
  });
});

/**
 * Processing relations.
 */

// TODO: activities!
function processRelations() {
  let indexes,
      index;

  //-- 1) Intra organization relations
  indexes = INDEXES.Organization;
  index = indexes.id;

  for (const id in index) {
    relations.Organization(index[id], rel => {

      // Solving those relations should be a matter of finding the
      // organization by acronym or plain name.
      let related = indexes.acronym[rel];

      if (!related)
        related = indexes.name[rel];

      // If we still have nothing, we should yell
      if (!related) {
        log.error(`Could not match the ${chalk.cyan(rel)} org->org relation.`);
        NB_RELATION_ERRORS++;

        // TEMP OVERRIDE!
        return indexes.acronym.FNSP._id;
      }
      else {
        return related._id;
      }
    });
  }

  //-- 2) People's relations
  index = INDEXES.People.id;

  for (const id in index) {
    relations.People(index[id], rel => {

      // Solving those relations by acronym
      let related = INDEXES.Organization.acronym[rel];

      // Else solving the relation by name
      if (!related)
        related = INDEXES.Organization.name[rel];

      // If we still have nothing, we should yell
      if (!related) {
        log.error(`Could not match the ${chalk.cyan(rel)} people->org.`);
        NB_RELATION_ERRORS++;

        // TEMP OVERRIDE!
        return indexes.acronym.FNSP._id;
      }
      else {
        return related._id;
      }
    });
  }
}

/**
 * Adding technical fields.
 */
function addTechnicalFields() {

  // Organization
  for (const k in INDEXES.Organization.id) {
    const org = INDEXES.Organization.id[k];

    // Spy
    org.latestChangeBy = 'IMPORT';
  }

  // People
  for (const k in INDEXES.People.id) {
    const person = INDEXES.People.id[k];

    // ISARI authorized centers
    if (person.academicMemberships) {
      person.isariAuthorizedCenters = person.academicMemberships.map(membership => {
        return {
          organization: membership.organization,
          isariRole: 'center_member'
        };
      });
    }

    // Spy
    person.latestChangeBy = 'IMPORT';
  }
}

/**
 * Retrieving LDAP information.
 */
function retrieveLDAPInformation(callback) {

  log.info(`Hitting ${chalk.cyan(ldapConfig.url)}.`);
  log.info(`Using ${chalk.cyan(ldapConfig.dn)} dn.`);

  return async.eachOfLimit(INDEXES.People.id, 10, (people, id, next) => {

    if (!people.sirhMatricule)
      return next();

    const options = {
      scope: 'sub',
      filter: `(employeenumber=${people.sirhMatricule})`
    };

    ldapClient.search(ldapConfig.dn, options, (err, res) => {
      res.on('searchEntry', entry => {
        people.ldapUid = entry.object.uid;
      });
      res.on('error', responseError => {
        return next(responseError);
      });
      res.on('end', () => {
        return next();
      });
    });

  }, callback);
}

/**
 * Process outline.
 * -----------------------------------------------------------------------------
 */
function ProcessError() {}

log.info('Starting...');
console.log();
async.series({
  organizations(next) {
    log.success('Processing organization files...');
    return async.series(organizationTasks, next);
  },
  people(next) {
    console.log();
    log.success('Processing people files...');
    return async.series(peopleTasks, next);
  },
  activities(next) {
    console.log();
    log.success('Processing activity files...');
    return async.series(activityTasks, next);
  },
  relations(next) {

    // If we have validation errors, let's call it a day
    if (NB_VALIDATION_ERRORS)
      return next(new ProcessError());

    const nbOrganization = Object.keys(INDEXES.Organization.id).length,
          nbPeople = Object.keys(INDEXES.People.id).length,
          nbActivity = Object.keys(INDEXES.Activity.id).length;

    console.log();
    log.success(`Finished processing ${chalk.cyan(NB_FILES)} files!`);
    log.info(`Collected ${chalk.cyan(nbOrganization)} unique organizations.`);
    log.info(`Collected ${chalk.cyan(nbPeople)} unique people.`);
    log.info(`Collected ${chalk.cyan(nbActivity)} unique activities.`);

    console.log();
    log.success('Processing relations...');
    processRelations();

    return next();
  },
  technicalFields(next) {

    console.log();
    log.info('Adding technical fields...');

    addTechnicalFields();

    return next();
  },
  ldap(next) {
    console.log();

    if (argv.skipLdap) {
      log.warning('Skipping LDAP resolution due to --skip-ldap.');
      return next();
    }

    log.info('Retrieving LDAP information...');

    return retrieveLDAPInformation(next);
  },
  jsonDump(next) {
    if (!argv.json)
      return next();

    console.log();
    log.info(`Dumping JSON result to ${chalk.cyan(argv.json)}...`);

    fs.writeFileSync(
      path.join(argv.json, 'organizations.json'),
      JSON.stringify(_.values(INDEXES.Organization.id), null, 2)
    );

    fs.writeFileSync(
      path.join(argv.json, 'people.json'),
      JSON.stringify(_.values(INDEXES.People.id), null, 2)
    );

    fs.writeFileSync(
      path.join(argv.json, 'activities.json'),
      JSON.stringify(_.values(INDEXES.Activity.id), null, 2)
    );

    return next();
  },
  mongoConnect(next) {

    // If we have relation errors, let's call it a day
    if (NB_RELATION_ERRORS)
      return next(new ProcessError());

    if (argv.dryRun)
      return next();

    return connect()
      .then(connection => {
        console.log();
        log.info('Connected to Mongo database.');
        CONNECTION = connection;
        return next();
      }, err => next(err));
  },
  mongoInsert(next) {

    // Don't do it if dry run
    if (argv.dryRun) {
      console.log();
      log.warning('This is a dry run. Items will not be inserted in the database.');
      return next();
    }

    console.log();
    log.info('Inserting items into the Mongo database...');

    return async.parallel([
      cb => Organization.collection.insertMany(_.values(INDEXES.Organization.id), cb),
      cb => People.collection.insertMany(_.values(INDEXES.People.id), cb),
      cb => Activity.collection.insertMany(_.values(INDEXES.Activity.id), cb)
    ], next);
  }
}, err => {

  // Terminating database connection
  if (CONNECTION)
    CONNECTION.close();

  // Terminating LDAP connection
  ldapClient.destroy();

  console.log();

  if (err) {

    if (err instanceof ProcessError) {
      if (NB_VALIDATION_ERRORS)
        log.error(`${NB_VALIDATION_ERRORS} total validation errors.`);
      if (NB_RELATION_ERRORS)
        log.error(`${NB_RELATION_ERRORS} total relation errors.`);

      log.error('Files were erroneous. Importation was not done. Please fix and import again.');
    }
    else {
      console.error(err);
    }

    return;
  }

  else {
    log.success('Done!');
  }
});
