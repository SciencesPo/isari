/**
 * ISARI HCERES Export Routine
 * ============================
 */
const async = require('async'),
      moment = require('moment');

const {
  createWorkbook,
  createSheet,
  addSheetToWorkbook,
  parseDate
} = require('./helpers.js');

const GRADES_INDEX = require('../../specs/export/grades.json');

const GENDER_MAP = {
  m: 'H',
  f: 'F',
  o: ''
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
      {key: 'jobType', label: 'Type d\'emploi\n(1)'},
      {key: 'name', label: 'Nom'},
      {key: 'firstName', label: 'Prénom'},
      {key: 'gender', label: 'H/F'},
      {key: 'birthDate', label: 'Date de naissance\n(JJ/MM/AAAA)'},
      {key: 'grade', label: 'Corps-grade\n(1)'},
      {key: 'panel', label: 'Panels disciplinaires / Branches d\'Activités Profession. (BAP)\n(2)'},
      {key: 'hdr', label: 'HDR\n(3)'},
      {key: 'organization', label: 'Etablissement ou organisme employeur\n(4)'}
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

          const relevantPosition = findRelevantItem(person.positions);

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
            gender: GENDER_MAP[person.gender],
            hdr: 'NON',
            organization: 'IEP Paris'
          };

          const relevantPosition = findRelevantItem(person.positions);

          const gradeAcademic = findRelevantItem(person.gradesAcademic);

          let gradeAdmin;

          if (relevantPosition)
            gradeAdmin = findRelevantItem(relevantPosition.gradesAdmin);

          if (gradeAcademic)
            info.jobType = GRADES_INDEX.academic[gradeAcademic.grade];
          else if (gradeAdmin)
            info.jobType = GRADES_INDEX.admin[gradeAdmin.grade];

          if (person.birthDate) {
            const [year, month, day] = person.birthDate.split('-');

            if (day)
              info.birthDate = moment(person.birthDate).format('DD/MM/YYYY');
            else if (month)
              info.birthDate = `${year}/${month}`;
            else
              info.birthDate = year;
          }

          if (person.distinctions && person.distinctions.some(d => d.title === 'HDR'))
            info.hdr = 'OUI';

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
module.exports = function(models, centerId, callback) {
  const workbook = createWorkbook();
  workbook.name = FILENAME;

  async.eachSeries(SHEETS, (sheet, next) => {
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

    return callback(null, workbook);
  });
};
