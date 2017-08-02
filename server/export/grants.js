/**
 * ISARI GRANTS Export Routine
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

// const NATIONALITIES = getSimpleEnumValues('nationalities')
// const GRADE_STATUS = require('../../specs/enums.nested.json').grade

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

const util = require('util')

/**
 * Helpers.
 */



const findAndSortRelevantItemsFactory = (reportPeriod) => (collection, periods) => {
        return _.sortBy(collection
                   .filter(e => overlap(e,reportPeriod) && 
                                (!periods ? true : _.some(periods,p => overlap(e,p)))),
                 [e => e.endDate ? -e.endDate.replace('-','') : -9999]
                 );
      };

function grantsMongoQuery(Organization, centerId, reportPeriod, callback){
// fetch activities whose scope orga is linked to and whose dates are in scope and which has at least one grant
  async.waterfall([
      next => {// org filter
        let orgFilter = false;
        if (centerId){
          orgFilter = {'organizations.organization': ObjectId(centerId)};
          next(null,orgFilter) 
        }
        else{
          Organization.aggregate([
            {$match:{isariMonitored:true}},
            {$project:{_id:1}}
          ]).then( orgs =>{
              orgFilter = {'organizations.organization':{$in:orgs.map(o => o._id)}};
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
          
          return next(null,{
                    $and:[
                      {activityType: 'projetderecherche'},
                      mongoStartDateQuery,
                      mongoEndDateQuery,
                      orgFilter,
                      {grants: {
                        $elemMatch:{
                          $and:[
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
 * Process.
 */
module.exports = function(models, centerId, range, role, callback) {

  const filename = (orgaName,range) => `financements_projets_${orgaName}${_(range).values().value().join('-')}.xlsx`

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
    async.waterfall([
        next2 => {
          grantsMongoQuery(models.Organization, centerId, reportPeriod, next2)
        },
        (mongoQuery,next2) => {
          // get data for both sheets
          models.Activity.find(mongoQuery)
          .populate({
            path: 'organizations.organization',
          })
          .populate({
            path: 'people.people',
            populate : {path:'academicMemberships.organization'}
          })
          .populate({
            path: 'grants.organization',
          })
          .then(activities => {
              const findAndSortRelevantItems = findAndSortRelevantItemsFactory(reportPeriod)
              let reportsLines = []
              grantsInfo = _(activities).map(a => {
                
                let lines = []
                const activityHeaders = {}
                activityHeaders.name = a.name
                activityHeaders.acronym = a.acronym
                activityHeaders.startDate = a.startDate
                activityHeaders.endDate = a.endDate
                activityHeaders.url = a.url
                activityHeaders.summary = a.summary
                activityHeaders.tags = a.tags.free
                activityHeaders.ercTags = a.tags.erc.map(t => simpleEnumValue('erc',t))

                // Organizations
                activityHeaders.leaders = []
                activityHeaders.leadersCountries = []
                activityHeaders.partners = []
                activityHeaders.otherCountries = []
                activityHeaders.tiersPart = []                

                a.organizations.forEach(o => {
                  if (o.role === 'coordinateur'){
                    activityHeaders.leaders.push(o.organization.acronym || o.organization.name)
                    o.organization.countries.forEach(c =>
                      activityHeaders.leadersCountries.push(simpleEnumValue('countries',c)))
                  }
                  else if (o.role === 'partenaire'){
                    activityHeaders.partners.push(o.organization.acronym || o.organization.name)
                    o.organization.countries.forEach(c =>
                      activityHeaders.otherCountries.push(simpleEnumValue('countries',c)))
                  }
                  else {
                    activityHeaders.tiersPart.push(o.organization.acronym || o.organization.name)
                    o.organization.countries.forEach(c =>
                      activityHeaders.otherCountries.push(simpleEnumValue('countries',c)))
                  }
                })
                activityHeaders.leadersCountries = _.uniq(activityHeaders.leadersCountries)
                activityHeaders.otherCountries = _.uniq(activityHeaders.otherCountries)

                // People
                activityHeaders.PIs = []
                activityHeaders.PIEmails = []
                activityHeaders.sciencesPomPIs = 0
                activityHeaders.sciencesPofPIs = 0
                activityHeaders.sciencesPooPIs = 0
                activityHeaders.respScientifiques = []
                activityHeaders.respScientifiquesEmails = []
                activityHeaders.sciencesPomRespScientifiques = 0
                activityHeaders.sciencesPofRespScientifiques = 0
                activityHeaders.sciencesPooRespScientifiques = 0
                activityHeaders.projectManagers = []
                activityHeaders.projectManagersEmails = []
                activityHeaders.sciencesPomProjectManagers = 0
                activityHeaders.sciencesPofProjectManagers = 0
                activityHeaders.sciencesPooProjectManagers = 0

                a.people.forEach(p => {
                  switch(p.role){
                    case 'PI': 
                      activityHeaders.PIs.push(p.people.firstName+' '+p.people.name)
                      if (p.people.contacts.length > 0)
                        activityHeaders.PIEmails.push(p.people.contacts[0].email)
                      break;
                    case 'responsableScientifique': 
                      activityHeaders.respScientifiques.push(p.people.firstName+' '+p.people.name)
                      if (p.people.contacts.length > 0)
                        activityHeaders.respScientifiquesEmails.push(p.people.contacts[0].email)
                      break;
                    case 'projectManager' :
                      activityHeaders.projectManagers.push(p.people.firstName+' '+p.people.name)
                      if (p.people.contacts.length > 0)
                        activityHeaders.projectManagersEmails.push(p.people.contacts[0].email)
                      break;
                  }

                   //******** CONFIDENTIAL INFO
                  if (['central_admin', 'central_reader', 'center_admin'].includes(role)) {
                    //protected fields
                    // is that people from Sciences Po, count by gender
                    
                    if (findAndSortRelevantItems(p.people.academicMemberships, [a])
                        .find(am => am.organization.isariMonitored)){
                      switch(p.people.gender){
                        case 'm': 
                          switch(p.role){
                            case 'PI': activityHeaders.sciencesPomPIs++; break;
                            case 'responsableScientifique': activityHeaders.sciencesPomRespScientifiques++; break;
                            case 'projectManager' : activityHeaders.sciencesPomProjectManagers++; break;
                            break;
                          }
                          break;
                        case 'f':
                          switch(p.role){
                            case 'PI': activityHeaders.sciencesPofPIs++; break;
                            case 'responsableScientifique': activityHeaders.sciencesPofRespScientifiques++; break;
                            case 'projectManager' : activityHeaders.sciencesPofProjectManagers++; break;
                            break;
                          }
                          break;
                        case 'o':
                          switch(p.role){
                            case 'PI': activityHeaders.sciencesPooPIs++; break;
                            case 'responsableScientifique': activityHeaders.sciencesPooRespScientifiques++; break;
                            case 'projectManager' : activityHeaders.sciencesPooProjectManagers++; break;
                            break;
                          }
                          break;
                      }                      
                    }
                  }
                })

                // grant info
                a.grants.map(g => {
                  let line = Object.assign({},activityHeaders)
                  // grant description
                  if (g.organization)
                    line.grantOrganization = g.organization.acronym || g.organization.name
                  line.grantType = simpleEnumValue('grantTypes', g.grantType)
                  line.grantProgram = simpleEnumValue('grantPrograms', g.grantProgram)
                  if (g.grantType && g.grantInstrument) {
                    line.grantInstrument = getNestedEnumValues('grantInstruments')[g.grantType].find(n => n.value === g.grantInstrument)
                    line.grantInstrument = line.grantInstrument ? line.grantInstrument.label.fr : g.grantInstrument
                  }
                  line.grantCall = g.grantCall
                  line.grantIdentifier = g.grantIdentifier
                  // status & dates
                  line.grantStatus = simpleEnumValue('grantStatuses', g.status)
                  line.submissionDate = g.submissionDate
                  line.grantStartDate = g.startDate
                  line.grantSndDate = g.endDate
                  line.durationInMonths = g.durationInMonths
                  // amounts and accounts
                  line.delegationCNRS = g.delegationCNRS ? 'oui' : 'non'
                  line.overheadsCalculation = g.overheadsCalculation
                  line.currency = g.currencyAmount
                  g.amounts.forEach(a => {
                    if (a.amountType === 'sciencespoobtenu' && a.budgetType === 'total' )
                        line.totalSciencesPo = a.amount
                    if (a.amountType === 'sciencespoobtenu' && a.budgetType === 'overheads' )
                        line.overheadsSciencesPo = a.amount
                    if (a.amountType === 'consortiumobtenu' && a.budgetType === 'total')
                        line.totalConsortium = a.amount
                  })
                

                  lines.push(line)

                  // prepare reports tab data
                  if (g.reports && g.reports.length >0){
                    g.reports.forEach(r => {
                      const reportLine = {}
                      // intitulé projet
                      reportLine.projectName = a.acronym || a.name
                      // type de rapport - scientifique/financier -
                      reportLine.reportType = r.reportType
                      // période 1,2, 3, 4 +
                      reportLine.reportPeriod = r.period
                      // date début,
                      reportLine.startDate = r.startDate
                      // date fin,
                      reportLine.endDate = r.endDate
                      // date début rapport,
                      reportLine.reportStartDate = r.reportStartDate
                      // date livraison rapport,
                      reportLine.reportEndDate = r.reportEndDate
                      // CAC - oui/non
                      reportLine.cac = r.cac
                      // remarks
                      reportLine.comments = r.remarks

                      reportsLines.push(reportLine)
                    })
                  }


                })

                return lines
              })
              .flatten()
              .value()

              //headers
              let grantInfosHeaders = [
                    // activity meta
                    {key: 'name', label: 'Nom'},
                    {key: 'acronym', label: 'Acronyme'},
                    {key: 'startDate', label: 'Date de début'},
                    {key: 'endDate', label: 'Date de fin'},
                    // orga and people
                    {key:'leaders', label:'coordinateur.s'},
                    {key:'leadersCountries', label:'pays coordinateur.s'},
                    {key:'partners', label:'partenaire.s'},
                    {key:'tiersPart', label:'partie.s tierce.s'},
                    {key:'otherCountries', label:'pays autres'},
                    {key:'PIs', label:'PI.s'},
                    {key:'PIEmails', label:'PI.s emails'},
                    {key:'sciencesPomPIs', label:'nb PI SCPO m', 'accessType': 'confidential'},
                    {key:'sciencesPofPIs', label:'nb PI SCPO f', 'accessType': 'confidential'},
                    {key:'sciencesPooPIs', label:'nb PI SCPO a', 'accessType': 'confidential'},
                    {key:'respScientifiques', label:'Responsable.s scientifique.s'},
                    {key:'respScientifiquesEmails', label:'Responsable.s Scientifique.s email.s'},
                    {key:'sciencesPomRespScientifiques', label:'nb RS SCPO m', 'accessType': 'confidential'},
                    {key:'sciencesPofRespScientifiques', label:'nb RS SCPO f', 'accessType': 'confidential'},
                    {key:'sciencesPooRespScientifiques', label:'nb RS SCPO a', 'accessType': 'confidential'},
                    {key:'projectManagers', label:'Project Manager.s'},
                    {key:'projectManagersEmails', label:'Project Manager.s email.s'},
                    {key:'sciencesPomProjectManagers', label:'nb PM SCPO m', 'accessType': 'confidential'},
                    {key:'sciencesPofProjectManagers', label:'nb PM SCPO f', 'accessType': 'confidential'},
                    {key:'sciencesPooProjectManagers', label:'nb PM SCPO a', 'accessType': 'confidential'},
                    //grant meta
                    {key: 'grantOrganization', label: 'Organisme de financement'},
                    {key: 'grantType', label: 'Type de financement'},
                    {key: 'grantProgram', label: 'Programme de financement'},
                    {key: 'grantInstrument', label: 'Instrument de financement'},
                    {key: 'grantCall', label: 'Appel à projet'},
                    {key: 'grantIdentifier', label: 'identifiant du financement'},
                    // grant status and dates
                    {key: 'grantStatus', label: 'Statut du financement'},
                    {key: 'submissionDate', label: 'Date de soumission'},
                    {key: 'grantStartDate', label: 'début du financement'},
                    {key: 'grantEndDate', label: 'fin du financement'},
                    {key: 'durationInMonths', label: 'durée du financement'},
                    // budgets and accounts
                    {key: 'delegationCNRS', label: 'gestion déléguée au CNRS ?'},
                    {key: 'overheadsCalculation', label: 'calcul des frais de gestion'},
                    {key: 'currency', label: 'Devise'},
                    {key: 'totalSciencesPo', label: 'Total obtenu Sciences Po'},
                    {key: 'overheadsSciencesPo', label: 'frais de gestion Sciences Po'}, 
                    {key: 'totalConsortium', label: 'Total obtenu Consortium'}, 
                    // activity last meta
                    {key: 'url', label: 'site web'},
                    {key: 'ercTags', label: 'Domaines ERC'},
                    {key: 'tags', label: 'mots clefs'}
                  ]

              //filter confidential headers
              if (!['central_admin', 'central_reader', 'center_admin'].includes(role)) {
                grantInfosHeaders = grantInfosHeaders.filter(h => !h.accessType || h.accessType !== 'confidential')
              }

              addSheetToWorkbook(
                workbook,
                createSheet(grantInfosHeaders,
                  grantsInfo),
                  'Financements'
                );

              // report tab headers
              let grantReportsHeaders = [
                {key: 'projectName', label: 'Projet'},
                {key: 'reportType', label: 'type'},
                {key: 'reportPeriod', label: 'période'},
                {key: 'startDate', label: 'Date de début'},
                {key: 'endDate', label: 'Date de fin'},
                {key: 'reportStartDate', label: 'Date début du raport'},
                {key: 'reportEndDate', label: 'Date livraison'},
                {key: 'cac', label: 'Commissaire au compte'},
                {key: 'comments', label: 'Commentaires'}
              ]
              addSheetToWorkbook(
                workbook,
                createSheet(grantReportsHeaders,
                  reportsLines),
                  'Rapports'
                );


              return next2(null)
          })
        }
      ], err => {
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
