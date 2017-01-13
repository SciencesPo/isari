/**
 * ISARI HCERES Export Routine
 * ============================
 */
const async = require('async'),
      moment = require('moment'),
      mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

const { getSimpleEnumValues, getNestedEnumValues } = require('../lib/enums')

const hceres2017enums = {};
getSimpleEnumValues('hceres2017').forEach(e => {
  hceres2017enums[e.value]=e.label.fr;
});

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
      (!item.endDate || parseDate(item.endDate).isSameOrAfter(HCERES_DATE)) &
      parseDate(item.startDate).isSameOrBefore(HCERES_DATE)
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
      {key: 'organization', label: 'Etablissement ou organisme employeur\n(4)'},
      {key: 'uai', label: 'Code UAI '},
      {key: 'tutelle', label: 'Ministère de tutelle'},
      {key: 'startDate', label: 'Date d’arrivée dans l’unité'},
      {key: 'futur', label: 'Participation au futur projet'},
      {key: 'orcid', label: 'Identifiant ORCID'}
    ],
    populate(models, centerId, callback) {
      const People = models.People;

      People.aggregate()
      .match({
        academicMemberships: {
          $elemMatch: {
            organization: centerId
          }
        }
      })
      .lookup({
          from: 'organizations',
          localField: 'academicMemberships.organization',
          foreignField: '_id',
          as: 'tutelle'
        })
      .then( people => {
        console.log(people)
        //-- 1) Filtering relevant people
        people = people.filter(person => {
          const validMembership = !!findRelevantItem(person.academicMemberships);

          const relevantPosition = findRelevantItem(person.positions);

          const relevantGrade = findRelevantItem(person.grades);

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
            organization: 'IEP Paris',
            tutelle: 'MENESR'
          };

          const relevantPosition = findRelevantItem(person.positions);

          if (person.tags && person.tags.hceres2017){
            console.log(person.tags.hceres2017);
            
            info.panel= person.tags.hceres2017
            .map(t => {
              if(hceres2017enums[t])
                return hceres2017enums[t];
            })
            .filter(e => e)
            .join(",")
          }

          if (person.ORCID)
            info.orcid=person.ORCID

          if (relevantPosition && relevantPosition.organization === 'CNRS')
            info.organization = 'CNRS';

          const grade = findRelevantItem(person.grades);

          let gradeAdmin;


          if (grade){
            if (grade.gradeStatus === "appuiadministratif" || grade.gradeStatus === "appuitechnique")
              info.jobType = GRADES_INDEX.admin[grade.grade];
            else
              info.jobType = GRADES_INDEX.academic[grade.grade];
            info.startDate=grade.startDate
          }
          
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
  },
  {
    id: 'doctorants',
    name: '3.3. docteurs & doctorants',
    headers: [
      {key: 'name', label: 'Nom'},
      {key: 'firstName', label: 'Prénom'},
      {key: 'gender', 'label': 'H/F'},
      {key: 'birthDate', label: 'Date de naissance'},
      {key: 'organization', label: 'Établissement ayant délivré le master (ou diplôme équivalent) du doctorant\n(1)'},
      {key: 'director', label: 'Directeur(s) de thèse\n(2)'},
      {key: 'startDate', label: 'Date de début de thèse\n(3)'},
      {key: 'endDate', label: 'Date de soutenance (pour les diplômés)\n(3)'},
      {key: 'grant', label: 'Financement du doctorant\n(4)'},
      {key: 'no', label: 'N° de l\'équipe interne de rattachement, le cas échéant\n(5)'}
    ],
    populate(models, centerId, callback) {
      const People = models.People;

      const query = [
        {
          $match: {
            'academicMemberships.organization': ObjectId(centerId),
            'distinctions.distinctionType': 'diplôme'
          }
        },
        {
          $lookup: {
            from: 'activities',
            localField: '_id',
            foreignField: 'people.people',
            as: 'activities'
          }
        },
        {
          $project: {
            name: 1,
            firstName: 1
          }
        }
      ];

      People.aggregate(query, (err, people) => {
        if (err)
          return callback(err);

        console.log(people);

        return callback(null, []);
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

  // TODO: check existence of center before!
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
