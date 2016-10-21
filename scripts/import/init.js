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
      yargs = require('yargs');

const FILES = require('./files'),
      clean = require('./clean');

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
 * Helpers.
 */

// Function taking a parsed CSV line and cleaning it.
function cleanLine(line) {
  for (const k in line)
    line[k] = clean.default(line[k]);

  return line;
}

/**
 * Processing organization files.
 */
const tasks = FILES.organizations.files.map(file => next => {

  // Read and parse CSV
  const filePath = path.join(
    argv.path,
    FILES.organizations.folder,
    file.path
  );

  const options = {
    delimiter: file.delimiter,
    columns: true
  };

  const data = fs.readFileSync(filePath, 'utf-8');

  csv.parse(data, options, (err, lines) => {
    if (err)
      return next(err);

    // Cleaning
    lines = lines.map(cleanLine);

    // Consuming
    lines = lines.map(file.consumer);

    console.log(lines);
    next();
  });
});

async.series(tasks, err => console.log('Done!'));
