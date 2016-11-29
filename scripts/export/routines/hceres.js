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
  addSheetToWorkbook,
  parseDate
} = require('../helpers.js');

/**
 * Constants.
 */
const FILENAME = 'hceres.xlsx';

const HCERES_DATE = '2017-06-30';

const READ_OPTIONS = {
  bookFiles: 'files',
  cellStyles: true,
  sheetStubs: true
};

/**
 * Helpers.
 */
function findRelevantItem(collection) {
  return collection.find(item => {
    return (
      !item.endDate ||
      parseDate(item.endDate).isSameOrAfter(HCERES_DATE)
    );
  });
}

/**
 * Sheets definitions.
 */
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

        console.log(people.length);

        //-- 1) Filtering relevant people
        people = people.filter(person => {
          const validMembership = !!findRelevantItem(person.academicMemberships);

          const relevantPosition = findRelevantItem(person.positions)

          const relevantGrade = findRelevantItem(person.gradesAcademic);

          return (
            validMembership &&
            (!relevantPosition || relevantPosition.jobType !== 'stage') &&
            (!relevantGrade || (relevantGrade.grade !== 'postdoc' && relevantGrade.grade !== 'doctorant(grade)'))
          );
        });

        console.log(people, people.length);

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
