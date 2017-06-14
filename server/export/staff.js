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
const GRADE_STATUS = require('../../specs/enums.nested.json').grade


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

const findAndSortRelevantItemsFactory = (reportPeriod) => (collection, periods) => {
        return _.sortBy(collection
                   .filter(e => overlap(e,reportPeriod) && 
                                (!periods ? true : _.some(periods,p => overlap(e,p)))),
                 [e => e.endDate ? -e.endDate.replace('-','') : -9999]
                 );
      };

function staffMongoQuery(Organization, centerId, reportPeriod, gradeStatusBlacklist, membershipTypes, callback){

  async.waterfall([
      next => {// org filter
        let orgFilter = false;
        if (centerId){
          orgFilter = {organization: ObjectId(centerId)};
          next(null,orgFilter) 
        }
        else{
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
      (orgFilter, next) => {
          const mongoEndDateQuery = { $or: [ 
                { endDate: { $exists: false }},
                { $and: [{ endDate: {$regex: /^.{4}$/}},{ endDate: {$gte:reportPeriod.startDate.slice(0,4)}}]},
                { $and: [{ endDate: {$regex: /^.{7}$/}},{ endDate: {$gte:reportPeriod.startDate.slice(0,7)}}]},
                { $and: [{ endDate: {$regex: /^.{10}$/}},{ endDate: {$gte:reportPeriod.startDate.slice(0,10)}}]}
                ] }
          const mongoStartDateQuery = { $or: [ 
                        { startDate: { $exists: false }},
                        { $and: [{ startDate: {$regex: /^.{4}$/}},{ startDate: {$lte:reportPeriod.endDate.slice(0,4)}}]},
                        { $and: [{ startDate: {$regex: /^.{7}$/}},{ startDate: {$lte:reportPeriod.endDate.slice(0,7)}}]},
                        { $and: [{ startDate: {$regex: /^.{10}$/}},{ startDate: {$lte:reportPeriod.endDate.slice(0,10)}}]}
                        ] }
          const gradeStatusQuery = {gradeStatus: { $not:{$in: gradeStatusBlacklist.gradeStatus ? gradeStatusBlacklist.gradeStatus : []} }}
          const gradeQuery = {grade: { $not:{$in: gradeStatusBlacklist.grade ? gradeStatusBlacklist.grade : []} }}
          return next(null,{
                    $and:[
                      {academicMemberships: {
                        $elemMatch:{
                          $and:[
                            orgFilter,
                            {membershipType:{$in:membershipTypes}},
                            mongoStartDateQuery,
                            mongoEndDateQuery
                          ]
                        }
                      }},
                      {grades: {
                        $elemMatch: {
                          $and:[
                            gradeQuery,
                            gradeStatusQuery,
                            mongoStartDateQuery,
                            mongoEndDateQuery
                          ]
                        }
                      }}
                    ]
                  })
        }
    ], (err, query) => {
      callback(err, query)
    })
}

/**
 * Sheets definitions.
 */
const FACULTY_SHEET_TEMPLATE ={
  headers:[   
      {key: 'name', label: 'Nom'},
      {key: 'firstName', label: 'Prénom'},
      {key: 'birthDate', label: 'Naissance'},
      {key: 'gender', label: 'Genre'},
      {key: 'nationalities', label: 'Nationalité.s'},  
      {key: 'lab1', label: 'Labo 1'},
      {key: 'lab1Type', label: 'Affil. labo 1'},
      {key: 'lab2', label: 'Labo 2'},
      {key: 'dept1', label: 'Dpt 1'},
      {key: 'dept2', label: 'Dpt 2'},
      {key: 'status', label: 'Statut'},
      {key: 'grade', label: 'Grade'},
      {key: 'tutelle', label: 'Tutelle'},  
      {key: 'startDate', label: 'Date d\'entrée'},
      {key: 'endDate', label: 'Date de sortie'},
      {key: 'doctorat', label: 'PHD'},      
      {key: 'dateDoctorat', label: 'date PHD'},      
      {key: 'orgasDoctorat', label: 'orga. PHD'},
      {key: 'countriesDoctorat', label: 'pays PHD'},
      {key: 'HDR', label: 'HDR'},      
      {key: 'dateHDR', label: 'date HDR'},      
      {key: 'orgasHDR', label: 'orga. HDR'},
      {key: 'countriesHDR', label: 'pays HDR'},
      {key: 'bonuses', label: 'Prime.s', 'accessType': 'confidential'},
      {key: 'facultyMonitoring', label: 'Suivi F.P.', 'accessType': 'confidential'},
      {key: 'facultyMonitoringDate', label: 'Suivi F.P. Date', 'accessType': 'confidential'},
      {key: 'facultyMonitoringComment', label: 'Suivi F.P. détails', 'accessType': 'confidential'},
      {key: 'emails', label: 'Email.s'},
      {key: 'bannerUid', label: 'ID banner'},
      {key: 'sirhMatricule', label: 'ID DRH'},
      {key: 'idSpire', label: 'ID Spire'},
      {key: 'CNRSMatricule', label: 'ID CNRS'},
      {key: 'orcid', label: 'ORCID'}
    ],
  populate(models, centerId, reportPeriod, gradeStatusBlacklist, role, callback) {
      const People = models.People;

      async.waterfall([
        next => {
          staffMongoQuery(models.Organization, centerId, reportPeriod, gradeStatusBlacklist, ['membre', 'rattaché'],next)
        },
        (mongoQuery,next) => {
          People.find(mongoQuery)
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

            const findAndSortRelevantItems = findAndSortRelevantItemsFactory(reportPeriod)
            
            //-- 2) Retrieving necessary data
            let facultyMember = _(people).map(person => {

              //******** PERSONAL INFO
              const info = {
                name: person.name,
                firstName: person.firstName,
                gender: GENDER_MAP[person.gender],
              };

              if (person.birthDate) {
                info.birthDate = person.birthDate;
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

              const internalMemberships = person.academicMemberships
                                                .filter(am =>
                                                  ['membre', 'rattaché'].includes(am.membershipType) &&
                                                  am.organization.isariMonitored
                                                );
              let relevantGrades = person.grades.filter(p =>
                              !gradeStatusBlacklist.gradeStatus.includes(p.gradeStatus) &&
                              !gradeStatusBlacklist.grade.includes(p.grade));

              // calculate intersection period between relevant grades and internalMemberships
              let relevantPeriods = _(relevantGrades)
                                        .map(grade =>{
                                          return internalMemberships
                                                .map(im => {
                                                  if (overlap(grade,im)){
                                                    const startDate = _.max([grade.startDate,im.startDate]);
                                                    const endDate = _.min([grade.endDate,im.endDate]);
                                                    let period = {}
                                                    if (startDate)
                                                      period.startDate = startDate
                                                    if (endDate)
                                                      period.endDate = endDate
                                                    return period
                                                  }
                                                })
                                                
                                        })
                                        .flatten()
                                        .compact()
                                        .value()

              // store min starDate as date d'entrée
              info.startDate = _.min(relevantPeriods.map(rp => rp.startDate))
              const endDate = _.max(relevantPeriods.map(rp => rp.endDate ? rp.endDate : '9999'))
              info.endDate = endDate === '9999' ? '' : endDate
              // then filter in requested period
              relevantPeriods = findAndSortRelevantItems(relevantPeriods)
              relevantGrades = findAndSortRelevantItems(relevantGrades, relevantPeriods)
              
          
              // if no filtered grade matched an internal membership, discard
              if (relevantPeriods.length === 0){                
                return undefined
              }
              

              //******** LAB AFFILIATION
              let labos = findAndSortRelevantItems(person.academicMemberships
                                    .filter(am =>
                                            ['membre', 'rattaché'].includes(am.membershipType)
                                    ), relevantPeriods);
              // force MAXPO and LIEPP labs and non-FNSP labs to lab2 column
              if (labos.length > 1 
                && overlap(labos[0],labos[1])
                && labos[0].organization._id !== labos[1].organization._id
                && (['MAXPO', 'LIEPP'].includes(labos[0].organization.acronym) 
                    || !labos[0].organization.isariMonitored)
                ){
                // swap lab 1 and 2
                const swap = labos[0];
                labos[0] = labos[1];
                labos[1] = swap;
              }

              if (labos.length > 0){
                info.lab1 = labos[0].organization.acronym || labos[0].organization.name;
                info.lab1Type = simpleEnumValue('academicMembershipType',labos[0].membershipType);
              }
              if (labos.length > 1 
                && overlap(labos[0],labos[1])
                && labos[0].organization._id !== labos[1].organization._id){
                info.lab2 =  labos[1].organization ? labos[1].organization.acronym || labos[1].organization.name : '';
              }

              //********* DEPT AFFILIATION

              if (person.deptMemberships && person.deptMemberships.length>0){
                const departements = findAndSortRelevantItems(person.deptMemberships, relevantPeriods);
                info.dept1 = departements.length > 0 ? simpleEnumValue('teachingDepartements',departements[0].departement) : '';
                
                if( departements.length > 1 && 
                  overlap(departements[0],departements[1]) &&
                  departements[0].departement !== departements[1].departement){
                  
                  info.dept2 = simpleEnumValue('teachingDepartements',departements[1].departement);
                }
              }

              //******** TUTELLE
              if (person.positions && person.positions.length > 0){
                const positions = findAndSortRelevantItems(person.positions.filter(p =>
                                        p.organization && p.organization.acronym &&
                                        ['FNSP', 'CNRS', 'MESR'].includes(p.organization.acronym)), relevantPeriods);
                if (positions && positions.length > 0 && positions[0].organization){
                  info.tutelle =  positions[0].organization.acronym || positions[0].organization.name;
                  // info.startTutelle = positions[0].startDate;
                  // info.endTutelle = positions[0].endDate;
                }
              }

              // const startDates = person.positions
              //       .filter(p => p.organization && p.organization.acronym &&
              //                    ['FNSP', 'CNRS', 'MESR'].includes(p.organization.acronym))
              //       .map(p => p.startDate)
              //       .sort()
              // if (startDates && startDates.length > 0)
              //   info.startDate = startDates[0]

              //******** GRADE & STATUS
              const grade = relevantGrades[0]
              if(grade.gradeStatus)
                info.status = simpleEnumValue('gradeStatus', grade.gradeStatus)
              if(grade.grade && grade.gradeStatus)
                info.grade = getNestedEnumValues('grade')[grade.gradeStatus].find(g => g.value === grade.grade).label.fr
                  


              //******** CONFIDENTIAL INFO
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

              //******** HDR & PHD
              const HDR = outputDistinctions(person.distinctions, 'hdr')
              if (HDR) {
                info.HDR = 'oui';
                info.dateHDR = HDR.date;
                info.orgasHDR = HDR.orgas;
                info.countriesHDR = HDR.countries;
              }
              else
                info.HDR = 'non';

              const doctorat = outputDistinctions(person.distinctions, 'doctorat')
              if (doctorat) {
                info.doctorat = 'oui';
                info.dateDoctorat = doctorat.date;
                info.orgasDoctorat = doctorat.orgas;
                info.countriesDoctorat = doctorat.countries;
              }
              else
                info.doctorat = 'non';

              //******** IDENTIFIERS
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
        callback(err, p);
      } );
      
    }
}

const TEMP_FACULTY_GRADES = ['directeurderechercheremerite','cherchcontractuel','postdoc','invité','CASSIST','doctorant(grade)','profémérite','profunivémérite','enseicherchcontractuel','ater']


const SHEETS = [
  {
    id: 'permFaculty',
    name: 'faculté permanente',
    headers: FACULTY_SHEET_TEMPLATE.headers,
    populate(models, centerId, reportPeriod, role, callback){
      gradeStatusBlacklist = {
       gradeStatus: ['appuiadministratif','appuitechnique','enseignant'],
       grade: TEMP_FACULTY_GRADES
     }
     return FACULTY_SHEET_TEMPLATE.populate(models, centerId, reportPeriod, gradeStatusBlacklist, role, callback)
    }
  },
  {
    id: 'tempFaculty',
    name: 'faculté temporaire',
    headers: FACULTY_SHEET_TEMPLATE.headers,
    populate(models, centerId, reportPeriod, role, callback){

      // find all grades not included in TEMP_FACULTY_GRADES
      let permFacultyGrades = []
      _.forEach(GRADE_STATUS,(grades,status) =>{
        // don't need to test those status
        if (!['appuiadministratif', 'appuitechnique', 'enseignant'].includes(status)){
          _.forEach(grades, g => {
            if (!TEMP_FACULTY_GRADES.includes(g.value))
              permFacultyGrades.push(g.value)
          });
        }
      })
      gradeStatusBlacklist = {
       gradeStatus: ['appuiadministratif','appuitechnique'],
       grade: permFacultyGrades
     }
     return FACULTY_SHEET_TEMPLATE.populate(models, centerId, reportPeriod, gradeStatusBlacklist, role, callback)
    }
  },
  {
    id: 'appui',
    name: 'Appui admin et tech',
    headers: [   
      {key: 'name', label: 'Nom'},
      {key: 'firstName', label: 'Prénom'},
      {key: 'birthDate', label: 'Naissance'},
      {key: 'gender', label: 'Genre'},
      {key: 'nationalities', label: 'Nationalité.s'},
      {key: 'lab1', label: 'Labo 1'},
      {key: 'lab1Type', label: 'Affil. labo 1'},
      {key: 'lab2', label: 'Labo 2'},
      {key: 'status', label: 'Statut'},
      {key: 'grade', label: 'Grade'},
      {key: 'tutelle', label: 'Tutelle'},  
      {key: 'startDate', label: 'Date d\'entrée'},
      {key: 'endDate', label: 'Date de sortie'},
      {key: 'jobName', label: 'Emploi personnalisé'},
      {key: 'jobType', label: 'Type de contrat'},
      {key: 'timepart', label: 'Grade'},
      {key: 'doctorat', label: 'PHD'},  
      {key: 'emails', label: 'Email.s'},
      {key: 'bannerUid', label: 'ID banner'},
      {key: 'sirhMatricule', label: 'ID DRH'},
      {key: 'idSpire', label: 'ID Spire'},
      {key: 'CNRSMatricule', label: 'ID CNRS'},
      {key: 'orcid', label: 'ORCID'}
    ],
    populate(models, centerId, reportPeriod, role, callback){
      const gradeStatusBlacklist = {
       gradeStatus: Object.keys(GRADE_STATUS).filter(s => !['appuiadministratif','appuitechnique'].includes(s)),
       grade: []
      }
      const People = models.People;
      async.waterfall([
        next => {
          staffMongoQuery(models.Organization, centerId, reportPeriod, gradeStatusBlacklist, ['membre', 'rattaché'],next)
        },
        (mongoQuery,next) => {
          People.find(mongoQuery)
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
              const findAndSortRelevantItems = findAndSortRelevantItemsFactory(reportPeriod);
              
              //-- 2) Retrieving necessary data
              let facultyMember = _(people).map(person => {

                //******** PERSONAL INFO
                const info = {
                  name: person.name,
                  firstName: person.firstName,
                  gender: GENDER_MAP[person.gender],
                };

                if (person.birthDate) {
                  info.birthDate = person.birthDate;
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

                const internalMemberships = person.academicMemberships
                                                  .filter(am =>
                                                    ['membre', 'rattaché'].includes(am.membershipType) &&
                                                    am.organization.isariMonitored
                                                  );
                let relevantGrades = person.grades.filter(p =>
                                !gradeStatusBlacklist.gradeStatus.includes(p.gradeStatus) &&
                                !gradeStatusBlacklist.grade.includes(p.grade));

                // calculate intersection period between relevant grades and internalMemberships
                let relevantPeriods = _(relevantGrades)
                                          .map(grade =>{
                                            return internalMemberships
                                                  .map(im => {
                                                    if (overlap(grade,im)){
                                                      const startDate = _.max([grade.startDate,im.startDate]);
                                                      const endDate = _.min([grade.endDate,im.endDate]);
                                                      let period = {}
                                                      if (startDate)
                                                        period.startDate = startDate
                                                      if (endDate)
                                                        period.endDate = endDate
                                                      return period
                                                    }
                                                  })
                                                  
                                          })
                                          .flatten()
                                          .compact()
                                          .value()

                // store min starDate as date d'entrée

                // startDate = minimum startDate of relevantPeriods & startDates of position with Sciences Po
                FNSPPositions = person.positions.filter(p =>
                                          p.startDate &&
                                          p.organization && p.organization.acronym &&
                                          p.organization.acronym === 'FNSP')
                info.startDate = _.min(relevantPeriods.concat(FNSPPositions).map(rp => rp.startDate))
                const endDate = _.max(relevantPeriods.concat(FNSPPositions).map(rp => rp.endDate ? rp.endDate : '9999'))
                info.endDate = endDate === '9999' ? '' : endDate 
                // then filter in requested period
                relevantPeriods = findAndSortRelevantItems(relevantPeriods)
                relevantGrades = findAndSortRelevantItems(relevantGrades, relevantPeriods)
                
            
                // if no filtered grade matched an internal membership, discard
                if (relevantPeriods.length === 0){                
                  return undefined
                }
                

                //******** LAB AFFILIATION
                let labos = findAndSortRelevantItems(person.academicMemberships
                                      .filter(am =>
                                              ['membre', 'rattaché'].includes(am.membershipType)
                                      ), relevantPeriods);
                // force MAXPO and LIEPP labs and non-FNSP labs to lab2 column
                if (labos.length > 1 
                  && overlap(labos[0],labos[1])
                  && labos[0].organization._id !== labos[1].organization._id
                  && (['MAXPO', 'LIEPP'].includes(labos[0].organization.acronym) 
                      || !labos[0].organization.isariMonitored)
                  ){
                  // swap lab 1 and 2
                  const swap = labos[0];
                  labos[0] = labos[1];
                  labos[1] = swap;
                }

                if (labos.length > 0){
                  info.lab1 = labos[0].organization.acronym || labos[0].organization.name;
                  info.lab1Type = simpleEnumValue('academicMembershipType',labos[0].membershipType);
                }
                if (labos.length > 1 
                  && overlap(labos[0],labos[1])
                  && labos[0].organization._id !== labos[1].organization._id){
                  info.lab2 =  labos[1].organization ? labos[1].organization.acronym || labos[1].organization.name : '';
                }

                //******** TUTELLE
                if (person.positions && person.positions.length > 0){
                  const positions = findAndSortRelevantItems(person.positions.filter(p =>
                                          p.organization && p.organization.acronym &&
                                          ['FNSP', 'CNRS', 'MESR'].includes(p.organization.acronym)), relevantPeriods);
                  if (positions && positions.length > 0 && positions[0].organization){
                    info.tutelle =  positions[0].organization.acronym || positions[0].organization.name;
                    info.jobName = positions[0].jobName
                    info.jobType = positions[0].jobType 
                    info.timepart = positions[0].timepart 
                  }
                }

                //******** GRADE & STATUS
                const grade = relevantGrades[0]
                if(grade.gradeStatus)
                  info.status = simpleEnumValue('gradeStatus', grade.gradeStatus)
                if(grade.grade && grade.gradeStatus)
                  info.grade = getNestedEnumValues('grade')[grade.gradeStatus].find(g => g.value === grade.grade).label.fr

                //******** PHD
                const doctorat = outputDistinctions(person.distinctions, 'doctorat')
                if (doctorat) {
                  info.doctorat = 'oui';
                }
                else
                  info.doctorat = 'non';

                //******** IDENTIFIERS
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
          });
        }],
        (err,p) =>{
          callback(err, p);
        }
      );
    }
  },
  {
    id: 'invited',
    name: 'Assoc. invit. aff.',
    headers: [   
      {key: 'name', label: 'Nom'},
      {key: 'firstName', label: 'Prénom'},
      {key: 'birthDate', label: 'Naissance'},
      {key: 'gender', label: 'Genre'},
      {key: 'nationalities', label: 'Nationalité.s'},
      {key: 'lab1', label: 'Labo 1'},
      {key: 'lab1Type', label: 'Affil. labo 1'},
      {key: 'lab2', label: 'Labo 2'},
      {key: 'countryLab2', label: 'Pays labo 2'},
      {key: 'status', label: 'Statut'},
      {key: 'grade', label: 'Grade'},
      {key: 'startDate', label: 'Date d\'entrée'},
      {key: 'endDate', label: 'Date de sortie'},
      {key: 'emails', label: 'Email.s'}
    ],
    populate(models, centerId, reportPeriod, role, callback){
      const gradeStatusBlacklist = {
       gradeStatus: [],
       grade: []
      }
      
      const membershipTypes = ['associé', 'affilié', 'visiting'];
      const People = models.People;
       async.parallel({
        people: parallelNext => {
          async.waterfall([
            next => {
              staffMongoQuery(models.Organization, centerId, reportPeriod, gradeStatusBlacklist, membershipTypes,next)
            },
            (mongoQuery,next) => {
              People.find(mongoQuery)
              .populate({
                path: 'positions.organization',
              })
              .populate({
                path: 'academicMemberships.organization',
              })
              .populate({
                path: 'distinctions.organizations',
              })
              .then(people => next(null, people));
            }],(err,people) => {
              
              parallelNext(err, people)});
        },
        activities: parallelNext => {
          let orgFilter = []
          if (centerId)
            orgFilter = [ {'organizations.organization': ObjectId(centerId)}]
          return models.Activity
            .find({
              $and: [
                {activityType: 'mob_entrante'}
              ].concat(orgFilter)
            })
            .populate({ path: 'organizations.organization'})
            .exec(parallelNext);
        }
      }, 
      (err, data) => {

        if (err)
          return callback(err);
        const {people, activities} = data;

        const findAndSortRelevantItems = findAndSortRelevantItemsFactory(reportPeriod);
        
        //-- 2) Retrieving necessary data
        let facultyMember = _(people).map(person => {

          //******** PERSONAL INFO
          const info = {
            name: person.name,
            firstName: person.firstName,
            gender: GENDER_MAP[person.gender],
          };

          if (person.birthDate) {
            info.birthDate = person.birthDate;
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

          const internalMemberships = person.academicMemberships
                                            .filter(am =>
                                              membershipTypes.includes(am.membershipType) &&
                                              am.organization.isariMonitored
                                            );

          // calculate intersection period between relevant grades and internalMemberships
          let relevantPeriods = internalMemberships
          // store min starDate as date d'entrée
          info.startDate = _.min(relevantPeriods.map(rp => rp.startDate))
          const endDate = _.max(relevantPeriods.map(rp => rp.endDate ? rp.endDate : '9999'))
          info.endDate = endDate === '9999' ? '' : endDate
          // then filter in requested period
          relevantPeriods = findAndSortRelevantItems(relevantPeriods)
          relevantGrades = findAndSortRelevantItems(person.grades, relevantPeriods)
          
      
          // if no filtered grade matched an internal membership, discard
          if (relevantPeriods.length === 0){                
            return undefined
          }
          

          //******** LAB AFFILIATION
          //let internalLabos = findAndSortRelevantItems(internalMemberships, relevantPeriods);
          // force MAXPO and LIEPP labs and non-FNSP labs to lab2 column
          if (internalMemberships.length > 1 
            && overlap(internalMemberships[0],internalMemberships[1])
            && internalMemberships[0].organization._id !== internalMemberships[1].organization._id
            && (['MAXPO', 'LIEPP'].includes(internalMemberships[0].organization.acronym))
            ){
            // swap lab 1 and 2
            const swap = internalMemberships[0];
            internalMemberships[0] = internalMemberships[1];
            internalMemberships[1] = swap;
          }

          if (internalMemberships.length > 0){
            info.lab1 = internalMemberships[0].organization.acronym || internalMemberships[0].organization.name;
            info.lab1Type = simpleEnumValue('academicMembershipType',internalMemberships[0].membershipType);
            let externalLabos = findAndSortRelevantItems(person.academicMemberships
                                                           .filter(am => am.organization._id != internalMemberships[0].organization._id
                                                            && !am.organization.isariMonitored),
                                                           [internalMemberships[0]])

            if (internalMemberships[0].membershipType === 'visiting' && externalLabos.length  === 0){
              // orga d'origine is missing, let's use activity visiting
              
              
              const visitingActivities = activities.filter(a => 
                                  a.people.some(p=> p.people && p.people.toString() === person._id.toString() 
                                                    )
                                  && overlap(internalMemberships[0],a)
                                  && a.organizations.some(o => o.organization.toString() === internalMemberships[0].organization.toString()
                                                             && o.role === 'orgadaccueil'))

              if (visitingActivities.length > 0)
                externalLabos = _(visitingActivities).map(a => a.organizations.filter(o => o.role === 'orgadorigine')).flatten().value()
            }
            if (externalLabos.length > 0){
              info.lab2 =  externalLabos[0].organization ? externalLabos[0].organization.acronym || externalLabos[0].organization.name : '';
              info.countryLab2 = externalLabos[0].organization ? externalLabos[0].organization.countries.map(c => simpleEnumValue('countries',c)).join(',') : '';
            }
          }

          //******** GRADE & STATUS
          if(relevantGrades.length>0){
            const grade = relevantGrades[0]
            if(grade.gradeStatus)
              info.status = simpleEnumValue('gradeStatus', grade.gradeStatus)
            if(grade.grade && grade.gradeStatus)
              info.grade = getNestedEnumValues('grade')[grade.gradeStatus].find(g => g.value === grade.grade).label.fr
          }

          return info;
        })
        // removing empty cases
        .compact()
        .value();
        // order by name
        facultyMember = _.sortBy(facultyMember, p => `${p.name} - ${p.firstName}`);
        
        return callback(null, facultyMember);
      });
       
    }
  }
];

/**
 * Process.
 */
module.exports = function(models, centerId, range, role, callback) {

  const filename = (orgaName,range) => `effectifs_${orgaName}${_(range).values().value().join('-')}.xlsx`

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
        // if (sheet.custom)
        //   return sheet.custom(models, centerId, range, role, (err, sheetData) => {
        //     if (err)
        //       return nextInSeries(err);

        //     for (const k in sheetData) {
        //       if (k !== '!ref')
        //         sheetData[k] = {
        //           v: sheetData[k],
        //           t: typeof sheetData[k] === 'number' ? 'n' : 's'
        //         };
        //     }

        //     addSheetToWorkbook(
        //       workbook,
        //       sheetData,
        //       sheet.name
        //     );

        //     return nextInSeries();
        //   });

        // Classical sheet with headers
        return sheet.populate(models, centerId, reportPeriod, role, (err, collection) => {
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
