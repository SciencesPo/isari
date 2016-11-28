/**
 * ISARI HCERES Export Routine
 * ============================
 */
const XLSX = require('xlsx'),
      path = require('path'),
      async = require('async');

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
    id: 'staff',
    name: '3.2. Liste des personnels',
    headers: [
      {key: 'jobType', label: 'Type d\'emploi'},
      {key: 'name', label: 'Nom'},
      {key: 'firstName', label: 'Prénom'}
    ],
    populate(models, centerId, callback) {
      const People = models.People;

      People.find({
        academicMemberships: {
          $elemMatch: {
            organization: centerId
          }
        }
      }, (err, people) => {
        if (err)
          return callback(err);

        return callback(null, people);
      });
    }
  }
];

/**
 * Process.
 */
module.exports = function(models, centerId, output, callback) {
  const workbook = createWorkbook();

  async.eachSeries(SHEETS, (sheet, next) => {
    return sheet.populate(models, centerId, (err, collection) => {
      if (err)
        return next(err);

      addSheetToWorkbook(
        workbook,
        createSheet(sheet.headers, collection),
        sheet.name
      );

      return next();
    });
  }, err => {
    if (err)
      return callback(err);

    // Writing the file to disk
    XLSX.writeFile(workbook, path.join(output, FILENAME));

    return callback();
  });
};
