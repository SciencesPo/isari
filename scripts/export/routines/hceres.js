/**
 * ISARI HCERES Export Routine
 * ============================
 */
const XLSX = require('xlsx'),
      path = require('path');

const {
  createWorkbook,
  createSheet,
  addSheetToWorkbook
} = require('../helpers.js');

/**
 * Constants.
 */
const FILENAME = 'hceres.xlsx';

const READ_OPTIONS = {
  bookFiles: 'files',
  cellStyles: true,
  sheetStubs: true
};

const SHEETS = [
  {
    name: 'staff',
    sheetName: '3.2. Liste des personnels',
    populate(centerId, models, callback) {

    }
  }
];

/**
 * Process.
 */
module.exports = function(models, centerId, callback) {
  const workbook = createWorkbook();

  // XLSX.writeFile(workbook, path.join(args.output, FILENAME));

  return callback();
};
