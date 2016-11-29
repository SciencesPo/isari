/**
 * ISARI Export Script Endpoint
 * =============================
 *
 * Script aiming at triggering the known export routines.
 */
const inspect = require('util').inspect,
      async = require('async'),
      yargs = require('yargs'),
      chalk = require('chalk'),
      path = require('path'),
      fs = require('fs');

const log = require('../logger')();

// Altering the NODE_CONFIG_DIR env variable so that `config` can resolve
process.env.NODE_CONFIG_DIR = path.join(__dirname, '..', '..', 'server', 'config');

if (inspect.defaultOptions)
  inspect.defaultOptions.depth = null;

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

process.on('unhandledRejection', err => {
  throw err;
});

// Routines
const ROUTINES = {
  hceres: {
    fn: require('./routines/hceres.js'),
    args(next) {
      return [models, argv.id, argv.output, next];
    },
    check() {
      if (!argv.id)
        return new Error('Expecting an id.');
    }
  }
};

let CONNECTION = null;

/**
 * Reading command line.
 */
const argv = yargs
  .usage('$0 --name hceres --output ./where/to/dump')
  .option('n', {
    alias: 'name',
    type: 'string',
    demand: true
  })
  .option('o', {
    alias: 'output',
    default: process.cwd(),
    type: 'string'
  })
  .help()
  .argv;

log.info('Starting export...');

const ROUTINE = ROUTINES[argv.name];

if (!ROUTINE) {
  log.error(`Unknown ${chalk.cyan(argv.name)} routine.`);
  process.exit(1);
}

/**
 * Process.
 */
async.series({
  connect(next) {
    return connect()
      .then(connection => {
        log.success('Successfully connected to the database.');
        CONNECTION = connection;
        return next();
      })
      .catch(err => {
        return next(err);
      });
  },
  routine(next) {

    const err = ROUTINE.check();

    if (err)
      return next(err);

    // Executing routine
    return ROUTINE.fn.apply(null, ROUTINE.args(next));
  }
}, err => {

  if (CONNECTION)
    CONNECTION.close();

  if (err) {
    if (err.message)
      log.error(err.message);
    return;
  }

  log.success('Success!');
});
