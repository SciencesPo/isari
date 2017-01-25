/**
 * ISARI HCERES Export Routine
 * ============================
 */
const async = require('async'),
      moment = require('moment'),
      mongoose = require('mongoose'),
      _ = require('lodash');

const debug = require('debug')('isari:export');

const ObjectId = mongoose.Types.ObjectId;

const {getSimpleEnumValues} = require('../lib/enums');

const hceres2017enums = {};
getSimpleEnumValues('hceres2017').forEach(e => {
  hceres2017enums[e.value] = e.label.fr;
});

const {
  createWorkbook,
  createSheet,
  addSheetToWorkbook,
  parseDate
} = require('./helpers.js');

//const GRADES_INDEX = require('../../specs/export/grades.json');
const GRADES_INDEX = require('../../specs/export/grades2gradesHCERES.json');

const GENDER_MAP = {
  m: 'H',
  f: 'F',
  o: ''
};

/**
 * Constants.
 */
const FILENAME = 'hceres.xlsx';

const HCERES_DATE = '2019-01-01';

/**
 * Helpers.
 */
function findRelevantItem(collection) {
  const relevants = collection.filter(item => {
    return (
      (!item.startDate && !item.endDate) ||
      (!item.endDate && parseDate(item.startDate).isSameOrBefore(HCERES_DATE)) ||
      (
        parseDate(item.endDate).isSameOrAfter(HCERES_DATE) &&
        parseDate(item.startDate).isSameOrBefore(HCERES_DATE)
      )
    );
  });
  return _(relevants)
  .sortBy(['endDate', 'startDate'])
  .value()
  .reverse()[0];
}

function formatDate(date) {
  if (date) {
    const [year, month, day] = date.split('-');
    if (day)
      return moment(date).format('DD/MM/YYYY');
    else if (month)
      return `${year}/${month}`;
    else
      return year;
  }
  else
    return '';
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
      {key: 'organization', label: 'Etablissement ou organisme employeur\n(4)'},
      {key: 'uai', label: 'Code UAI '},
      {key: 'tutelle', label: 'Ministère de tutelle'},
      // {key: 'startDate', label: 'Date d’arrivée dans l’unité'},
      {key: 'futur', label: 'Participation au futur projet'},
      // {key: 'orcid', label: 'Identifiant ORCID'}
    ],
    populate(models, centerId, callback) {
      const People = models.People;

      People.find({
        academicMemberships: {
          $elemMatch: {
            organization: ObjectId(centerId)
          }
        }
      })
      .populate({
        path: 'positions.organization',
      })
      .then(people => {

        //-- 1) Filtering relevant people
        people = people.filter(person => {
          const validMembership = !!findRelevantItem(person.academicMemberships.filter(am => am.organization.toString() === centerId));

          const relevantPosition = findRelevantItem(person.positions);

          const relevantGrade = findRelevantItem(person.grades);

          return (
            validMembership &&
            (!relevantPosition || relevantPosition.jobType !== 'stage') &&
            (!relevantGrade ||
              (relevantGrade.grade !== 'postdoc' &&
                relevantGrade.grade !== 'doctorant(grade)' &&
                relevantGrade.grade !== 'STAGE')
            )
          );
        });

        //-- 2) Retrieving necessary data
        people = _(people).map(person => {

          const info = {
            name: person.name,
            firstName: person.firstName,
            gender: GENDER_MAP[person.gender],
            hdr: 'NON',
            organization: 'IEP Paris',
            tutelle: 'MENESR'
          };


          if (person.tags && person.tags.hceres2017) {
            info.panel = person.tags.hceres2017
            .map(t => {
              if (hceres2017enums[t])
                return hceres2017enums[t];
            })
            .filter(e => e)
            .join(',');
          }

          if (person.ORCID)
            info.orcid = person.ORCID;

          if (person.positions) {
            if (person.positions.map(p => p.organization).find(t => t.acronym === 'CNRS')) {
              info.organization = 'CNRS';
              info.uai = '0753639Y';
            }
            else {
              info.organization = 'IEP Paris';
              info.uai = '0753431X';
            }
          }

          // date d'arrivé
          info.startDate = formatDate(findRelevantItem(person.academicMemberships).startDate);

          const grade = findRelevantItem(person.grades);

          if (grade) {
            if (GRADES_INDEX[grade.gradeStatus] && GRADES_INDEX[grade.gradeStatus][grade.grade]) {
              info.jobType = GRADES_INDEX[grade.gradeStatus][grade.grade].type_emploiHCERES;
              info.grade = GRADES_INDEX[grade.gradeStatus][grade.grade].gradeHCERES;
            }
            else {
              // no grade DRH ?
              info.jobType = '?? ' + grade.gradeStatus;
              info.grade = '?? ' + grade.grade;
            }
          }
          else
            debug(`No grade found for ${person.name} ${person.firstName}`);

          if (person.birthDate) {
            info.birthDate = formatDate(person.birthDate);
          }

          if (person.distinctions && person.distinctions.some(d => d.title === 'HDR'))
            info.hdr = 'OUI';

          return info;
        })
        // removing empty cases
        .compact()
        .value();

        // order by name
        people = _.sortBy(people, p => `${p.name} - ${p.firstName}`);

        return callback(null, people);
      });
    }
  }
];

/**
 * Process.
 */
module.exports = function(models, centerId, callback) {
  const workbook = createWorkbook(FILENAME);

  // TODO: check existence of center before!
  async.eachSeries(SHEETS, (sheet, next) => {

    // Custom sheet
    if (sheet.custom)
      return sheet.custom(models, centerId, (err, sheetData) => {
        if (err)
          return next(err);

        for (const k in sheetData) {
          if (k !== '!ref')
            sheetData[k] = {
              v: sheetData[k],
              t: typeof sheetData[k] === 'number' ? 'n' : 's'
            };
        }

        addSheetToWorkbook(
          workbook,
          sheetData,
          sheet.name
        );

        return next();
      });

    // Classical sheet with headers
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
