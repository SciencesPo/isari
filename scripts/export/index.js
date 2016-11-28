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

/**
 * Process.
 */
async.series({
  connect(next) {
    return connect()
      .then(connection => {
        log.info('Successfully connected to the database.');
        CONNECTION = connection;
        return next();
      }, err => next(err));
  },
  routine(next) {
    console.log('Routine...');
    return next();
  }
}, err => {

  if (CONNECTION)
    CONNECTION.close();

  if (err) {
    log.error('An error occurred!');
    return console.error(err);
  }

  log.success('Success!');
});
