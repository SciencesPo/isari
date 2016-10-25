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
      inspect = require('util').inspect
      chalk = require('chalk');

const FILES = require('./files'),
      clean = require('./clean');
      helpers = require('./helpers'),
      log = require('./logger')();

if (inspect.defaultOptions)
  inspect.defaultOptions.depth = null;

// Altering the NODE_CONFIG_DIR env variable so that `config` can resolve
process.env.NODE_CONFIG_DIR = path.join(__dirname, '..', '..', 'server', 'config');

const {
  connect,
  People,
  Organization,
  Activity
} = require('../../server/lib/model');

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
 * Reading command line.
 */
const argv = yargs
  .usage('$0 --path ./path/to/isari_data')
  .option('p', {
    alias: 'path',
    demand: true
  })
  .help()
  .argv;

/**
 * Indexes.
 */
const INDEXES = {
  Organization: {
    acronym: Object.create(null),
    name: Object.create(null)
  }
};

/**
 * State.
 */
let ERRORS = 0;

/**
 * Helpers.
 */

// Function taking a parsed CSV line and cleaning it.
function cleanLine(line) {
  for (const k in line)
    line[k] = clean.default(line[k]);

  return line;
}

// Function attributing a mongo id to a line
function attachMongoId(line) {
  line._id = mongoose.Types.ObjectId();
}

log.info('Starting...');

/**
 * Processing organization files.
 */
log.info('Processing organization files...');
const tasks = FILES.organizations.files.map(file => next => {
  // Read and parse CSV
  const filePath = path.join(
    argv.path,
    FILES.organizations.folder,
    file.path
  );

  console.log();
  log.info(`Reading ${filePath}`);

  const options = {
    delimiter: file.delimiter,
    columns: true
  };

  const data = fs.readFileSync(filePath, 'utf-8');

  csv.parse(data, options, (err, lines) => {
    if (err)
      return next(err);

    log.info(`Parsed ${lines.length} lines.`);

    // Cleaning
    lines = lines.map(cleanLine);

    // Consuming
    lines = lines.map(file.consumer);

    // Giving unique identifier
    lines.forEach(attachMongoId);

    // Validating
    lines.forEach((line, i) => {
      const validationError = (new Organization(line, false)).validateSync();

      if (validationError) {
        const errors = validationError.errors;

        // Dumping errors
        for (const key in errors) {
          let error = errors[key];

          while (error.reason) {
            error = error.reason;
          }

          // Don't display ObjectId errors for we will solve the relations later
          if (error.kind === 'ObjectId')
            return;

          ERRORS++;

          const meta = {
            line: i + 1,
            type: error.name,
            message: error.message
          };

          const coloredMessage = meta.message
            .replace(/`(.*?)`/g, function(_, m) {
              return chalk.cyan(m);
            })
            .replace(/".*?"/g, function(m) {
              return chalk.green(m);
            });

          log.error(`Line ${meta.line}: ${meta.type} => ${coloredMessage}`, meta);
        }
      }
    });

    // Indexing
    lines.forEach(file.indexer.bind(null, INDEXES));

    // TODO: log found entities

    next();
  });
});

async.series(tasks, err => {
  if (err)
    throw err;

  console.log();
  if (ERRORS) {
    log.error(`${ERRORS} total errors.`);
    log.error('Files were erroneous. Importation was not done. Please fix and import again.');
  }
  else {
    log.success('Done!')
  }
});
