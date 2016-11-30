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

const GRADES_INDEX = require('../../../specs/export/grades.json');

const GENDER_MAP = {

};

/**
 * Constants.
 */
const FILENAME = 'hceres.xlsx';

const HCERES_DATE = '2017-06-30';

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
      {key: 'firstName', label: 'Prénom'},
      {key: 'gender', label: 'H/F'},
      {key: 'birthDate', label: 'Date de naissance\n(JJ/MM/AAAA)'},
      {key: 'grade', label: 'Corps-grade\n(1)'}
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

        //-- 2) Retrieving necessary data
        people = people.map(person => {
          const info = {
            name: person.name,
            firstName: person.firstName,
            gender: person
          };

          let relevantPosition = findRelevantItem(person.positions);

          let gradeAcademic = findRelevantItem(person.gradesAcademic);

          let gradeAdmin;

          if (relevantPosition)
            findRelevantItem(relevantPosition.gradesAdmin);

          console.log(gradeAcademic, gradeAdmin)

          return info;
        });

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
