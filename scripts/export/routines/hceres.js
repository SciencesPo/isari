/**
 * ISARI HCERES Export Routine
 * ============================
 */
const XLSX = require('xlsx'),
      path = require('path');

/**
 * Constants.
 */
const FILENAME = 'hceres.xlsx';

const READ_OPTIONS = {
  bookFiles: 'files',
  cellStyles: true,
  sheetStubs: true
};

const WRITE_OPTIONS = {
  bookSST: true,
  bookType: 'xlsx'
};

/**
 *
 */
module.exports = function(models, args, callback) {
  const sourcePath = args.source;

  if (!sourcePath)
    return callback(new Error('No source provided.'));

  // Parsing the workbook
  const workbook = XLSX.readFile(sourcePath, READ_OPTIONS);

  XLSX.writeFile(workbook, path.join(args.output, FILENAME), WRITE_OPTIONS);

  return callback();
};
