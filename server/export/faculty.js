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

const NATIONALITIES = getSimpleEnumValues('nationalities')



const simpleEnumValue = (enumName, value) =>{
  const e = getSimpleEnumValues(enumName).find(e => e.value === value)
  return e ? e.label.fr : value
};

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
function findAndSortRelevantItems(collection) {
  return _.sortBy(collection
             .filter(e => overlap(e,reportPeriod)),
           [e => e.endDate ? e.endDate : Infinity]
           ).reverse();
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
      {key: 'lab1', label: 'Laboratoire de rattachement 1 dernier connu sur la période'},
      {key: 'lab2', label: 'Laboratoire de rattachement 2 avant-dernier connu sur la période'},
      {key: 'dept1', label: 'Département de rattachement actuel 1'},
      {key: 'dept2', label: 'Département de rattachement actuel 2'},
      {key: 'status', label: 'Statut dernier connu sur la période'},
      {key: 'grade', label: 'Grade  dernier connu sur la période'},
      {key: 'tutelle', label: 'Tutelle dernière connue'},
      {key: 'startTutelle', label: 'Date de début dernière tutelle'},
      {key: 'endTutelle', label: 'Date de fin derière tutelle'},
      {key: 'startDate', label: 'Date d\'entrée'},
      {key: 'bonuses', label: 'Primes sur la période'},
      {key: 'facultyMonitoring', label: 'Suivi faculté permanente'},
      {key: 'facultyMonitoringDate', label: 'Suivi faculté permanente Date'},
      {key: 'facultyMonitoringComment', label: 'Suivi faculté permanente Commentaire'}
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
      const reportPeriod = {startDate:start, endDate:end}
      const findAndSortRelevantItems = (collection) => {
        return _.sortBy(collection
                   .filter(e => overlap(e,reportPeriod)),
                 [e => e.endDate ? e.endDate : Infinity]
                 ).reverse();
      };


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
                    {membershipType:{$in:['membre', 'rattaché']}},
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
              

              if (person.nationalities && person.nationalities.length > 0) {
                info.nationalities = person.nationalities.map(n => 
                 simpleEnumValue('nationalities',n)
                ).join(', ');
              }        

              if (person.contacts && person.contacts.length>0)
              {
                info.emails = person.contacts.map(c => c.email).filter(e => e).join(', '); 
              }



              const labos = findAndSortRelevantItems(person.academicMemberships);
              info.lab1 = labos.length > 0 ? labos[0].organization.acronym || labos[0].organization.name : '';
              info.lab2 = labos.length > 1 ? labos[1].organization.acronym || labos[1].organization.name : '';

              if (person.deptMemberships && person.deptMemberships.length>0){
                const departements = findAndSortRelevantItems(person.deptMemberships);
                info.dept1 = departements.length > 0 ? simpleEnumValue('teachingDepartements',departements[0].departement) : '';
                info.dept2 = departements.length > 1 ? simpleEnumValue('teachingDepartements',departements[1].departement)  : '';
              }

              if (person.positions && person.positions.length > 0){
                const positions = findAndSortRelevantItems(person.positions);
                if (positions && positions.length > 0 && positions[0].organization){
                  info.tutelle =  positions[0].organization.acronym || positions[0].organization.name;
                  info.startTutelle = positions[0].startDate;
                  info.endTutelle = positions[0].endDate;
                }
              }

              const startDates = person.academicMemberships
                  .filter(am => am.organization.isariMonitored)
                  .map(am => am.startDate)
                  .concat(person.positions
                    .filter(p => p.organization.acronym &&
                                 ['FNSP', 'CNRS', 'MESR'].includes(p.organization.acronym))
                    .map(p => p.startDate)
                  ).sort()
              if (startDates && startDates.length > 0)
                info.startDate = startDates[0]


              if (person.grades){
                  grade = findAndSortRelevantItems(person.grades).filter(p =>
                              !['appuiadministratif','appuitechnique'].includes(p.gradeStatus) 
                            )[0]
                  if (grade){
                    if(grade.gradeStatus)
                      info.status = simpleEnumValue('gradeStatus', grade.gradeStatus)
                    if(grade.grade && grade.gradeStatus)
                      info.grade = getNestedEnumValues('grade')[grade.gradeStatus].find(g => g.value === grade.grade).label.fr
                  
                  }
              }

              if (person.bonuses && person.bonuses.length > 0){
                info.bonuses = findAndSortRelevantItems(person.bonuses)
                  .map(b => {
                    const type = simpleEnumValue('bonusTypes',b.bonusType);
                    const startYear = b.startDate ? b.startDate.slice(0,4):'';
                    const endYear = b.endDate ? '-'+b.endDate.slice(0,4):'';
                    return `${type} ${startYear}${endYear}` 
                  }).join(", ")
              }

              if (person.facultyMonitoring && person.facultyMonitoring.length > 0){
                const fms = findAndSortRelevantItems(person.facultyMonitoring);
                if (fms && fms.length > 0){
                  const fm = fms[0];
                  info.facultyMonitoring = simpleEnumValue('facultyMonitoringTypes', fm.facultyMonitoringType)
                  info.facultyMonitoringDate = fm.date ? fm.date : '';
                  info.facultyMonitoringComment = fm.comments ? fm.comments : '';
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
