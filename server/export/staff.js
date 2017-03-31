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
 * Helpers.
 */


const outputDistinctions = (distinctions, distinctionSubtype) => {

  let distinctionInfos = undefined
  if (distinctions) {
    const dists = _.sortBy(distinctions.filter(
                                d => d.distinctionType === 'diplôme' &&
                                     d.distinctionSubtype === distinctionSubtype)
                          ,d => d.date)
                  .reverse()
    if (dists.length > 0) {
      distinctionInfos = {};
      distinctionInfos.date = dists.map(d => d.date).join(', ');  
      distinctionInfos.countries = _(dists.map(d =>{
              let countries = []
              if (d.countries && d.countries.length > 0)
                countries = countries.concat(d.countries.map(c => simpleEnumValue('countries',c)));
              if (d.organizations)
                countries = countries.concat(_(d.organizations.filter(o => o.countries)
                                        .map(o => 
                                          o.countries.map(c => simpleEnumValue('countries',c))
                                          )).flatten().value())

              return countries
            }))
            .flatten()
            .value()
      distinctionInfos.countries = _.uniq(distinctionInfos.countries).join(', ');

      distinctionInfos.orgas = _(dists.filter(d => d.organizations).map(d => {
        return d.organizations.map(o => o.acronym || o.name)
      }))
      .flatten()
      .value()
      .join(', ');
    }
  }
  return distinctionInfos
}

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
      {key: 'lab1Type', label: 'Affiliation laboratoire de rattachement 1'},
      {key: 'lab2', label: 'Laboratoire de rattachement 2 avant-dernier connu sur la période'},
      {key: 'dept1', label: 'Département de rattachement actuel 1'},
      {key: 'dept2', label: 'Département de rattachement actuel 2'},
      {key: 'status', label: 'Statut dernier connu sur la période'},
      {key: 'grade', label: 'Grade  dernier connu sur la période'},
      {key: 'tutelle', label: 'Tutelle dernière connue'},
      {key: 'startTutelle', label: 'Date de début dernière tutelle'},
      {key: 'endTutelle', label: 'Date de fin derière tutelle'},
      {key: 'startDate', label: 'Date d\'entrée'},
      {key: 'HDR', label: 'HDR'},      
      {key: 'dateHDR', label: 'date HDR'},      
      {key: 'orgasHDR', label: 'organisation HDR'},
      {key: 'countriesHDR', label: 'pays HDR'},
      {key: 'doctorat', label: 'Doctorat'},      
      {key: 'dateDoctorat', label: 'date doctorat'},      
      {key: 'orgasDoctorat', label: 'organisation doctorat'},
      {key: 'countriesDoctorat', label: 'pays doctorat'},
      {key: 'bonuses', label: 'Primes sur la période', 'accessType': 'confidential'},
      {key: 'facultyMonitoring', label: 'Suivi faculté permanente', 'accessType': 'confidential'},
      {key: 'facultyMonitoringDate', label: 'Suivi faculté permanente Date', 'accessType': 'confidential'},
      {key: 'facultyMonitoringComment', label: 'Suivi faculté permanente Commentaire', 'accessType': 'confidential'},
      {key: 'bannerUid', label: 'id banner'},
      {key: 'sirhMatricule', label: 'matricule DRH'},
      {key: 'idSpire', label: 'id Spire'},
      {key: 'CNRSMatricule', label: 'matricule CNRS'}

    ],
    populate(models, centerId, range, role, callback) {
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

      const mongoEndDateQuery = { $or: [ 
                { endDate: { $exists: false }},
                { $and: [{ endDate: {$regex: /^.{4}$/}},{ endDate: {$gte:start.slice(0,4)}}]},
                { $and: [{ endDate: {$regex: /^.{7}$/}},{ endDate: {$gte:start.slice(0,7)}}]},
                { $and: [{ endDate: {$regex: /^.{10}$/}},{ endDate: {$gte:start.slice(0,10)}}]}
                ] }
        const mongoStartDateQuery = { $or: [ 
                { startDate: { $exists: false }},
                { $and: [{ startDate: {$regex: /^.{4}$/}},{ startDate: {$lte:end.slice(0,4)}}]},
                { $and: [{ startDate: {$regex: /^.{7}$/}},{ startDate: {$lte:end.slice(0,7)}}]},
                { $and: [{ startDate: {$regex: /^.{10}$/}},{ startDate: {$lte:end.slice(0,10)}}]}
                ] }


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
                    mongoStartDateQuery,
                    mongoEndDateQuery
                  ]
                }
              }},
              {grades: {
                $elemMatch: {
                  $and:[
                    {gradeStatus: { $not:{$in: ['appuiadministratif','appuitechnique']} }},
                    mongoStartDateQuery,
                    mongoEndDateQuery
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
          .populate({
            path: 'distinctions.organizations',
          })
          .then(people => {
            
            //-- 2) Retrieving necessary data
            let facultyMember = _(people).map(person => {

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
              if (labos.length > 0){
                info.lab1 = labos[0].organization.acronym || labos[0].organization.name;
                info.lab1Type = simpleEnumValue('academicMembershipType',labos[0].membershipType);
              }
              if (labos.length > 1 
                && overlap(labos[0],labos[1])
                && labos[0].organization._id !== labos[1].organization._id){
                info.lab2 =  labos[1].organization ? labos[1].organization.acronym || labos[1].organization.name : '';
              }
              if (person.deptMemberships && person.deptMemberships.length>0){
                const departements = findAndSortRelevantItems(person.deptMemberships);
                info.dept1 = departements.length > 0 ? simpleEnumValue('teachingDepartements',departements[0].departement) : '';
                
                if( departements.length > 1 && 
                  overlap(departements[0],departements[1]) &&
                  departements[0].departement !== departements[1].departement){
                  
                  info.dept2 = simpleEnumValue('teachingDepartements',departements[1].departement);
                }
              }

              if (person.positions && person.positions.length > 0){
                const positions = findAndSortRelevantItems(person.positions);
                if (positions && positions.length > 0 && positions[0].organization){
                  info.tutelle =  positions[0].organization.acronym || positions[0].organization.name;
                  info.startTutelle = positions[0].startDate;
                  info.endTutelle = positions[0].endDate;
                }
              }

              const startDates = person.positions
                    .filter(p => p.organization && p.organization.acronym &&
                                 ['FNSP', 'CNRS', 'MESR'].includes(p.organization.acronym))
                    .map(p => p.startDate)
                    .sort()
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

              if (['central_admin', 'central_reader', 'center_admin'].includes(role)) {
                //protected fields
                if (person.bonuses && person.bonuses.length > 0){
                  info.bonuses = findAndSortRelevantItems(person.bonuses)
                    .map(b => {
                      const type = simpleEnumValue('bonusTypes',b.bonusType);
                      const startYear = b.startDate ? b.startDate.slice(0,4):'';
                      const endYear = b.endDate ? '-'+b.endDate.slice(0,4):'';
                      return `${type} ${startYear}${endYear}` 
                    }).join(", ")
                }

                if (person.facultyMonitoring && person.facultyMonitoring.length > 0) {
                  const fms = findAndSortRelevantItems(person.facultyMonitoring);
                  if (fms && fms.length > 0){
                    const fm = fms[0];
                    info.facultyMonitoring = simpleEnumValue('facultyMonitoringTypes', fm.facultyMonitoringType)
                    info.facultyMonitoringDate = fm.date ? fm.date : '';
                    info.facultyMonitoringComment = fm.comments ? fm.comments : '';
                  }
                }
              }

              const HDR = outputDistinctions(person.distinctions, "hdr")
              if (HDR) {
                info.HDR = "oui";
                info.dateHDR = HDR.date;
                info.orgasHDR = HDR.orgas;
                info.countriesHDR = HDR.countries;
              }

              const doctorat = outputDistinctions(person.distinctions, "doctorat")
              if (doctorat) {
                info.doctorat = "oui";
                info.dateDoctorat = doctorat.date;
                info.orgasDoctorat = doctorat.orgas;
                info.countriesDoctorat = doctorat.countries;
              }

              if (person.ORCID)
                info.orcid = person.ORCID;
              if (person.sirhMatricule)
                info.sirhMatricule = person.sirhMatricule;
              if (person.bannerUid)
                info.bannerUid = person.bannerUid;
              if(person.idSpire)
                info.idSpire = person.idSpire;
              if (person.CNRSMatricule)
                info.CNRSMatricule = person.CNRSMatricule

              return info;
            })
            // removing empty cases
            .compact()
            .value();
            // order by name
            facultyMember = _.sortBy(facultyMember, p => `${p.name} - ${p.firstName}`);

            next(null, facultyMember);

          })
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
module.exports = function(models, centerId, range, role, callback) {

  const filename = (orgaName,range) => `effectifs_${orgaName}${_(range).values().value().join('-')}.xlsx`

  async.waterfall([next=>{
    if (centerId){
      models.Organization.find({_id:ObjectId(centerId)}).then(data =>{
        if (data.length > 0){
          const orgaName = data[0].name
          next(null, createWorkbook(filename(orgaName,range)))
        }
        else
          throw new Error('centerId unknown')
      })
    }
    else{
      next(null,createWorkbook(filename('SciencesPo',range)))
    }
  },
  (workbook,next) => {
      async.eachSeries(SHEETS, (sheet, nextInSeries) => {

        // Custom sheet
        if (sheet.custom)
          return sheet.custom(models, centerId, range, role, (err, sheetData) => {
            if (err)
              return nextInSeries(err);

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

            return nextInSeries();
          });

        // Classical sheet with headers
        return sheet.populate(models, centerId, range, role, (err, collection) => {
          if (err){
            return nextInSeries(err);
          }
          //filter confidential headers
          let headers = sheet.headers
          if (!['central_admin', 'central_reader', 'center_admin'].includes(role)) {
            headers = sheet.headers.filter(h => !h.accessType || h.accessType !== 'confidential')
          }

          addSheetToWorkbook(
            workbook,
            createSheet(headers, collection),
            sheet.name
          );

          return nextInSeries();
        });
      }, err => {
        if (err)
          return next(err);
        return next(null, workbook);
      });
  }], (err,workbook) => {
      if (err)
        return callback(err);
      return callback(null, workbook);
    });
};
