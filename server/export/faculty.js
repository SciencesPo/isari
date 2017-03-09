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

const {
  getSimpleEnumValues,
  getNestedEnumValues} = require('../lib/enums');

const hceres2017enums = {};
getSimpleEnumValues('hceres2017').forEach(e => {
  hceres2017enums[e.value] = e.label.fr;
});

const {
  createWorkbook,
  createSheet,
  addSheetToWorkbook,
  parseDate,
  fillIncompleteDate,
  overlap
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
const FILENAME = 'faculté_permanente.xlsx';


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
    name: 'faculté permanente',
    headers: [
      
      {key: 'name', label: 'Nom'},
      {key: 'firstName', label: 'Prénom'},
      {key: 'birthDate', label: 'Date de naissance'},
      {key: 'gender', label: 'Genre'},
      {key: 'nationalities', label: 'Nationalité.s'},
      {key: 'emails', label: 'Email.s'},
      {key: 'lab1', label: 'Laboratoire de rattachement actuel 1'},
      {key: 'lab2', label: 'Laboratoire de rattachement actuel 2'},
      {key: 'dept1', label: 'Département de rattachement actuel 1'},
      {key: 'dept2', label: 'Département de rattachement actuel 2'},
      {key: 'status', label: 'Statut actuel'},
      {key: 'grade', label: 'Grade actuel'},
      {key: 'tutelle', label: 'Tutelle'},
      {key: 'startDate', label: 'Date de début'},
      {key: 'endDate', label: 'Date de fin'},
    ],
    populate(models, centerId, range, callback) {
      const People = models.People;
      let facultyMember = []

      let [start, end] = ['0000','9999'];
      
      if (range.length === 1){
        start = range[0];
        end = range[0];
      }
      if (range.length === 2){
        start = range[0];
        end = range[1];
      }
      
      start = fillIncompleteDate(start, true);
      end = fillIncompleteDate(end, false);



      async.waterfall([
        next => {
          // org filter
          let orgFilter = false;
          if (centerId){
            orgFilter = {organization: ObjectId(centerId)};
            next(null,orgFilter) 
          }
          else{
            const Organization = models.Organization;
            Organization.aggregate([
              {$match:{isariMonitored:true}},
              {$project:{_id:1}}
            ]).then( orgs =>{
                orgFilter = {organization:{$in:orgs.map(o => o._id)}};
                next(null,orgFilter);
            }
            )
          }
        },
        (orgFilter,next) => {
          People.find({
            $and:[
              {academicMemberships: {
                $elemMatch:{
                  $and:[
                    orgFilter,
                    {$or: [
                        {endDate:{$gte: start}},
                        {endDate:{$exists: false }}
                    ]},
                    {$or: [
                        {startDate:{$lte: end}},
                        {startDate:{$exists: false }}
                    ]}
                  ]
                }
              }},
              {grades: {
                $elemMatch: {
                  $and:[
                    {gradeStatus: { $not:{$in: ['appuiadministratif','appuitechnique']} }},
                    {$or: [
                          {endDate:{$gte: start}},
                          {endDate:{$exists: false }}
                      ]},
                      {$or: [
                          {startDate:{$lte: end}},
                          {startDate:{$exists: false }}
                      ]}
                  ]
                }
              }}
            ]
          })
          .populate({
            path: 'positions.organization',
          })
          .populate({
            path: 'academicMemberships.organization',
          })
          .then(people => {
            //-- 2) Retrieving necessary data
            facultyMember = _(people).map(person => {

              const info = {
                name: person.name,
                firstName: person.firstName,
                gender: GENDER_MAP[person.gender],
              };

              if (person.birthDate) {
                info.birthDate = formatDate(person.birthDate);
              }
              
              if (person.grades){
                  grade = _.sortBy(
                            person.grades.filter(p =>
                             overlap(p,[start,end])
                             && !['appuiadministratif','appuitechnique'].includes(p.gradeStatus) 
                            ),
                            [p => p.endDate || p.startDate])
                            .reverse()[0]
                  if (grade){
                    info.status = getSimpleEnumValues('gradeStatus').find(g => g.value === grade.gradeStatus).label.fr
                    info.grade = getNestedEnumValues('grade')[grade.gradeStatus].find(g => g.value === grade.grade).label.fr
                  
                  }
              }

              if (person.ORCID)
                info.orcid = person.ORCID;

              // if (person.positions) {
              //   if (person.positions.map(p => p.organization).find(t => t.acronym === 'CNRS')) {
              //     info.organization = 'CNRS';
              //     info.uai = '0753639Y';
              //   }
              //   else {
              //     info.organization = 'IEP Paris';
              //     info.uai = '0753431X';
              //   }
              // }

              // // date d'arrivé
              // info.startDate = formatDate(findRelevantItem(person.academicMemberships).startDate);

              // const grade = findRelevantItem(person.grades);

              // if (grade) {
              //   if (GRADES_INDEX[grade.gradeStatus] && GRADES_INDEX[grade.gradeStatus][grade.grade]) {
              //     info.jobType = GRADES_INDEX[grade.gradeStatus][grade.grade].type_emploiHCERES;
              //     info.grade = GRADES_INDEX[grade.gradeStatus][grade.grade].gradeHCERES;
              //   }
              //   else {
              //     // no grade DRH ?
              //     info.jobType = '?? ' + grade.gradeStatus;
              //     info.grade = '?? ' + grade.grade;
              //   }
              // }
              // else
              //   debug(`No grade found for ${person.name} ${person.firstName}`);

              

              // if (person.distinctions && person.distinctions.some(d => d.title === 'HDR'))
              //   info.hdr = 'OUI';

              return info;
            })
            // removing empty cases
            .compact()
            .value();
            // order by name
            facultyMember = _.sortBy(facultyMember, p => `${p.name} - ${p.firstName}`);

            next(null, facultyMember);
          });
      }], (err,p) =>{
        if (err) throw err;
        callback(null, p);
      } );
      
    }
  }
];

/**
 * Process.
 */
module.exports = function(models, centerId, range, callback) {
  const workbook = createWorkbook(FILENAME);

  // TODO: check existence of center before!
  async.eachSeries(SHEETS, (sheet, next) => {

    // Custom sheet
    if (sheet.custom)
      return sheet.custom(models, centerId, range, (err, sheetData) => {
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
    return sheet.populate(models, centerId, range, (err, collection) => {
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
