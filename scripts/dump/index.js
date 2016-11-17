/**
 * ISARI Dump Script
 * ==================
 *
 * Script aiming at dumping the entirety of the Mongo database as JSON files.
 * The script will create one folder per model & one JSON file per item in the
 * related collection.
 */
const inspect = require('util').inspect,
      async = require('async'),
      mkdirp = require('mkdirp'),
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
  .usage('$0 --output ./where/to/dump')
  .option('o', {
    alias: 'output',
    default: process.cwd(),
    type: 'string'
  })
  .help()
  .argv;

/**
 * Creating relevant folders.
 */
const FOLDERS = {};

log.info('Starting to dump...');
for (const k in models) {
  FOLDERS[k] = path.join(argv.output, k);
  mkdirp.sync(FOLDERS[k]);
  log.success(`Created the ${chalk.grey(FOLDERS[k])} folder.`);
}

/**
 * Dumping function.
 */
function dump(model, next) {
  log.info(`Dumping ${model}...`);

  return models[model].find({}, (err, items) => {
    if (err)
      return next(err);

    log.info(`Found ${chalk.cyan(items.length)} ${model} items.`);

    items.forEach(item => {
      const data = item.toObject(),
            name = `${data._id}.json`,
            file =  path.join(FOLDERS[model], name);

      fs.writeFile(file, JSON.stringify(data, null, 2));
    });

    return next();
  });
}

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
  dumpPeople(next) {
    return async.mapSeries(Object.keys(models), dump, next);
  }
}, err => {

  if (CONNECTION)
    CONNECTION.close();

  if (err) {
    log.error('An error occurred!');
    return console.error(err);
  }

  log.success('Database was successfully dumped!');
});
