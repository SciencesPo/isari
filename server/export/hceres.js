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
  parseDate,
  overlap,
  formatDate
} = require('./helpers.js');

//const GRADES_INDEX = require('../../specs/export/grades.json');
const GRADES_INDEX = require('../../specs/export/grades2gradesHCERES.json');

const PERMANENT = 'permanent';
const TEMPORARY = 'temporary';
const permanentTemporary = (jobType) => {
  const PERMANENT_JOBTYPES = ['CDI', 'disponibilité', 'détachement', 'emploipublic']
  const TEMPORARY_JOBTYPES = ['CDD', 'stage', 'alternance', 'COD', 'CDDdusage'];
  if (PERMANENT_JOBTYPES.includes(jobType))
    return PERMANENT;
  else
    if (TEMPORARY_JOBTYPES.includes(jobType))
      return TEMPORARY;
    else
      return undefined;
}


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
  const relevants = collection.filter(item => {
    return overlap(item,{startDate:HCERES_DATE,endDate:HCERES_DATE});
  });

  return _(relevants)
    .sortBy(['endDate', 'startDate'])
    .value()
    .reverse()[0];
}


/**
 * Sheets definitions.
 */
const SHEETS = [
  {
    id: 'unit',
    name: '2. Composition de l\'unité',
    custom(models, centerId, callback) {

      // Retrieving related people & activities
      return async.parallel({
        people: next => {
          return models.People
            .find({
              'academicMemberships':{
                $elemMatch:{
                  'organization': centerId,
                  'membershipType':'membre'
                }
              }
            })
            .populate('positions.organization')
            .exec(next);
        },
        activities: next => {
          return models.Activity
            .find({
              'organizations.organization': centerId
            })
            .populate('organizations.organization')
            .populate('people.people')
            .exec(next);
        }
      }, (err, data) => {
        if (err)
          return callback(err);

        const {activities, people} = data;

        const headers = {
          A1: 'Personnels permanents en activité',
          B1: 'Enseignement supérieur* (6) :',
          B2: 'IEP PARIS',
          E1: 'Organismes de recherche employeur* (6) :',
          E2: 'IEP PARIS',
          G2: 'Autres',
          F2: 'CNRS',
          H1: 'Total'
        };

        const sheetData = {
          A1: 'Professeurs et assimilés',
            B1: 0,
          A2: 'Maîtres de conférences et assimilés',
            B2: 0,
          A3: 'Directeurs de recherche et assimilés',
            E3: 0,
            F3: 0,
          A4: 'Chargés de recherche et assimilés',
            E4: 0,
            F4: 0,
          A5: 'Conservateurs, cadres scientifiques EPIC, fondations, industries…',
          A6: 'Professeurs du secondaire détachés dans le supérieur',
            B6: 0,
          A7: 'ITA-BIATSS autres personnels cadre et non cadre EPIC…',
            B7: 0,
            E7: 0,
            F7: 0,
          A8: 'Sous-total personnels permanents en activité',

          // TODO...
          A9: 'Enseignants-chercheurs non titulaires, émérites et autres (2)',
            H9: 0,
          A10: 'Chercheurs non titulaires, émérites et autres (3)',
            H10: 0,
          A11: 'Autres personnels non titulaires (4)',
            H11: 0,
          A12: 'Sous-total personnels non titulaires, émérites et autres',
          A13: 'Total personnels de l\'unité',
          A14: 'Nombre total de doctorants',
            H14: 0,
          A15: 'dont doctorants bénéficiant d\'un contrat spécifique au doctorat',
          A16: 'Nombre de thèses soutenues (5)',
            H16: 0,
          A17: 'Nombre d\'HDR soutenues (5)',
            H17: 0,
          A18: 'Nombre de professeurs invités (5)',
            H18: 0,
          A19: 'Nombre de stagiaires accueillis (5)',
            H19: 0
        };

        people.forEach(person => {

          // Finding relevant position
          const position = findRelevantItem(person.positions || []),
                relevantGrade = findRelevantItem(person.grades || []),
                academicMembership = findRelevantItem(person
                                                .academicMemberships
                                                .filter(a => 
                                                  a.organization.toString() === centerId &&
                                                  ['membre', 'rattaché'].includes(a.membershipType))),
                grade = relevantGrade && relevantGrade.grade,
                gradeStatus = relevantGrade && relevantGrade.gradeStatus,
                organization = position && position.organization.acronym,
                cnrs = organization === 'CNRS',
                fnsp = organization === 'FNSP',
                mesr = organization === 'MESR';

      
          
          // Stagiaires avec une date de présence dans l'unité comprise entre 01/01/12 et 30/06/17
          if (
            person.grades.some(grade =>
              // grade de stagiaire ?
              grade.grade === 'STAGE' &&
              // sur la période HCERES ?
              overlap(grade, {startDate: '2012-01-01', endDate: '2017-06-30'}) &&
              // stage pendant une afiliation au labo
              person.academicMemberships
              .filter(a => a.organization.toString() === centerId)
              .some(am => overlap(am,grade))
            )||
            person.positions.some(p =>
              p.jobType === 'stage' &&
              // sur la période HCERES ?
              overlap(p, {startDate: '2012-01-01', endDate: '2017-06-30'}) &&
              // stage pendant une afiliation au labo
              person.academicMemberships
              .filter(a => a.organization.toString() === centerId)
              .some(am => overlap(am,p))
            )
          ) {
            console.log(person.name);
            sheetData.H19++;
          }


          if (!academicMembership)
            // filtering out past members
            return;

          // Professeur.es FNSP, Professeur.e.s des universités, Associate professors FNSP
          if (
            (
              (fnsp && grade === 'professeuruniv') ||
              (/^professeur([12]|ex)?$/.test(grade)) ||
              (fnsp && grade === 'associateprofessor')
            )
          ) {
            sheetData.B1++;
            return;
          }

          // Maître.sse.s de conférence, Assistant professors FNSP
          // NOTE: mconfHC?
          if (
            (grade === 'mconf') ||
            (fnsp && grade === 'assistantprofessor')
          ) {
            sheetData.B2++;
            return;
          }

          // PRAG
          if (grade === 'prag') {
            sheetData.B6++;
            return;
          }

          // grades administratifs et techniques en CDI avec tutelle MESR
          if (
            mesr &&
            (
              gradeStatus === 'appuiadministratif' ||
              gradeStatus === 'appuitechnique'
            ) 
            &&
            position && permanentTemporary(position.jobType) === PERMANENT
          ) {
            sheetData.B7++;
            return;
          }

          // Directrices, directeurs de recherche FNSP
          if (
            fnsp &&
            /^directeurderecherche[12x]?$/.test(grade)
          ) {
            sheetData.E3++;
            return;
          }

          // Directrices, directeurs de recherche CNRS
          if (
            cnrs &&
            /^directeurderecherche[12x]?$/.test(grade)
          ) {
            sheetData.F3++;
            return;
          }

          // Chargé.e.s de recherche FNSP
          if (
            fnsp &&
            /^chargederecherche[12]?$/.test(grade)
          ) {
            sheetData.E4++;
            return;
          }

          // Chargé.e.s de recherche CNRS
          if (
            cnrs &&
            /^chargederecherche[12]?$/.test(grade)
          ) {
            sheetData.F4++;
            return;
          }

          // grades administratifs et techniques en CDI avec tutelle FNSP
          if (
            fnsp &&
            (
              gradeStatus === 'appuiadministratif' ||
              gradeStatus === 'appuitechnique'
            ) &&
            position && permanentTemporary(position.jobType) === PERMANENT
          ) {
            sheetData.E7++;
            return;
          }

          // grades administratifs et techniques en CDI avec tutelle CNRS
          if (
            cnrs &&
            (
              gradeStatus === 'appuiadministratif' ||
              gradeStatus === 'appuitechnique'
            ) &&
            position && permanentTemporary(position.jobType) === PERMANENT
          ) {
            sheetData.F7++;
            return;
          }

          // Professeur.e.s FNSP émérites, Professeur.e.s des universités émérites, ATER
          if (
            grade === 'profunivémérite' ||
            grade === 'ater' ||
            (grade === 'profémérite')
          ) {
            sheetData.H9++;
            return;
          }

          // Directrices, directeurs de recherche FNSP émérites, Directrices, directeurs de recherche CNRS émérites, Assistant.e.s de recherche
          if (
            (grade === 'directeurderechercheremerite') ||
            grade === 'CASSIST' ||
            grade === 'postdoc'
          ) {
            sheetData.H10++;
            return;
          }

          // grades administratifs et techniques en CDD avec tutelle MESR, FNSP et CNRS
          if (
            (
              gradeStatus === 'appuiadministratif' ||
              gradeStatus === 'appuitechnique'
            ) &&
            position && permanentTemporary(position.jobType) === TEMPORARY
          ) {
            sheetData.H11++;
            return;
          }

          
        });

        const invitedSet = new Set();

        activities.forEach(activity => {

          // Doctorant.e.s
          if (
            activity.activityType === 'doctorat' &&
            activity.organizations.some(org => (
              '' + org.organization._id === centerId &&
              org.role === 'inscription'
            )) &&
            !!findRelevantItem([activity])
          ) {
            sheetData.H14++;
          }

          // Doctorant.e.s avec une date de soutenance comprise entre 01/01/12 et 30/06/17
          if (
            activity.activityType === 'doctorat' &&
            activity.organizations.some(org => (
              '' + org.organization._id === centerId &&
              org.role === 'inscription'
            )) &&
            activity.endDate
          ) {
            const endDate = parseDate(activity.endDate);

            if (
              endDate.isSameOrAfter('2012-01-01') &&
              endDate.isSameOrBefore('2017-06-30')
            ) {
              sheetData.H16++;
            }
          }

          // HDR avec une date de soutenance comprise entre 01/01/12 et 30/06/17
          if (
            activity.activityType === 'hdr' &&
            activity.organizations.some(org => (
              '' + org.organization._id === centerId &&
              org.role === 'inscription'
            )) &&
            activity.endDate
          ) {
            const endDate = parseDate(activity.endDate);

            if (
              endDate.isSameOrAfter('2012-01-01') &&
              endDate.isSameOrBefore('2017-06-30')
            ) {
              sheetData.H17++;
            }
          }

          // Invité.e.s avec une date de présence dans l'unité au 30/06/17
          // et présent au moins 8 semaines à compter dans Chercheurs non titulaires, émérites et autres (3)
          if (
            activity.activityType === 'mob_entrante' &&
            activity.organizations.some(org => (
              '' + org.organization._id === centerId &&
              org.role === 'orgadaccueil'
            )) &&
            overlap(activity, {startDate: HCERES_DATE, endDate: HCERES_DATE}) &&
            (activity.endDate &&
              activity.startDate &&
              moment(activity.endDate).diff(moment(activity.startDate), 'week') >= 8
            )

          ) {
            const invitedPerson = activity.people.find(p => p.role === 'visiting');

            if (invitedPerson && !invitedSet.has(invitedPerson.people._id)) {
              invitedSet.add(invitedPerson.people._id);
              sheetData.H10++;
            }
          }
        });

        // computing totals
        sheetData.H1 = sheetData.B1;
        sheetData.H2 = sheetData.B2;
        sheetData.H3 = sheetData.E3 + sheetData.F3;
        sheetData.H4 = sheetData.E4 + sheetData.F4;
        sheetData.H6 = sheetData.B6;
        sheetData.H7 = sheetData.B7 + sheetData.E7 + sheetData.F7;
        sheetData.B8 = sheetData.B1 + sheetData.B2 + sheetData.B6 + sheetData.B7;
        sheetData.E8 = sheetData.E3 + sheetData.E4 + sheetData.E7;
        sheetData.F8 = sheetData.F3 + sheetData.F4 + sheetData.F7;
        sheetData.H8 = sheetData.B8 + sheetData.E8 + sheetData.F8;
        if (sheetData.H8 !== (sheetData.H1 + sheetData.H2 + sheetData.H3 + sheetData.H4 + sheetData.H6 + sheetData.H7))
          sheetData.I8 = 'erreur total';
        sheetData.H12 = sheetData.H9 + sheetData.H10 + sheetData.H11;
        sheetData.H13 = sheetData.H8 + sheetData.H12;

        // Applying header
        const adjusted = {};

        for (const k in sheetData) {
          const [, col, row] = k.match(/([A-Z])(\d+)/);
          adjusted[col + (+row + 2)] = sheetData[k];
        }

        const sheetDataWithHeaders = Object.assign(headers, adjusted);

        sheetDataWithHeaders['!ref'] = 'A1:H21';
        sheetDataWithHeaders['!merges'] = [
          'A1:A2',
          'B1:C1',
          'E1:F1',
          'H1:H2'
        ];

        return callback(null, sheetDataWithHeaders);
      });
    }
  },
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
      {key: 'no', label: 'N° de l\'équipe interne de rattachement'},
      {key: 'startDate', label: 'Date d’arrivée dans l’unité'},
      {key: 'futur', label: 'Participation au futur projet'},
      {key: 'orcid', label: 'Identifiant ORCID'}
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
          const validMembership = !!findRelevantItem(person.academicMemberships.filter(am => 
            am.organization.toString() === centerId &&
            ['membre', 'rattaché'].includes(am.membershipType) ));

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

          // date d'arrivé
          info.startDate = formatDate(findRelevantItem(person.academicMemberships).startDate);

          const grade = findRelevantItem(person.grades);
          const position = findRelevantItem(person.positions);

          if (position){
            // tutelle
            if (position.organization.acronym === 'CNRS') {
              info.organization = 'CNRS';
              info.uai = '0753639Y';
            }
            else {
              info.organization = 'IEP Paris';
              info.uai = '0753431X';
            }
          }

          // for admin and tech people => use isari jobType for HCERES jobType
          if (grade && ['appuitechnique','appuiadministratif'].includes(grade.gradeStatus)){
            if (position && permanentTemporary(position.jobType) === PERMANENT)
              info.jobType = 'AP_tit';
            else
              if (position && permanentTemporary(position.jobType) === TEMPORARY)
                info.jobType = 'AP_aut';
          }
          else
            if (grade && GRADES_INDEX[grade.gradeStatus] && GRADES_INDEX[grade.gradeStatus][grade.grade])
              //HCERES jobType translasted from grade fro academic folks
              info.jobType = GRADES_INDEX[grade.gradeStatus][grade.grade].type_emploiHCERES;

          // grade
          if (grade && GRADES_INDEX[grade.gradeStatus] && GRADES_INDEX[grade.gradeStatus][grade.grade])
            // HCERES grade translated from ISARI grade
            info.grade = GRADES_INDEX[grade.gradeStatus][grade.grade].gradeHCERES;
          

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
  },
  {
    id: 'doctorants',
    name: '3.3. docteurs et doctorants',
    headers: [
      {key: 'name', label: 'Nom'},
      {key: 'firstName', label: 'Prénom'},
      {key: 'gender', label: 'H/F'},
      {key: 'birthDate', label: 'Date de naissance'},
      {key: 'organization', label: 'Établissement ayant délivré le master (ou diplôme équivalent) du doctorant\n(1)'},
      {key: 'director', label: 'Directeur(s) de thèse\n(2)'},
      {key: 'startDate', label: 'Date de début de thèse\n(3)'},
      {key: 'endDate', label: 'Date de soutenance (pour les diplômés)\n(3)'},
      {key: 'grant', label: 'Financement du doctorant\n(4)'},
      {key: 'no', label: 'N° de l\'équipe interne de rattachement, le cas échéant\n(5)'}
    ],
    populate(models, centerId, callback) {
      const Activity = models.Activity;

      const query = {
          $and: [
            {activityType: 'doctorat'},
            {organizations: {$elemMatch: {organization: ObjectId(centerId)}}}]
      };


      Activity
      .find(query)
      .populate({
        path: 'people.people',
        populate: {path: 'distinctions.organizations'}
      })
      .exec((err, results) => {
        if (err)
          return callback(err);

        let exportLines = [];

        results
        //Liste des docteurs ayant soutenu depuis le 1/01/2012 et des doctorants présents dans l’unité au 30 juin 2017
        .filter(r => !r.endDate || parseDate(r.endDate) >= moment('2012-01-01'))
        .forEach(result => {
          // get the PHD students from people
          const phdStudent = result.people.filter(p => p.role === 'doctorant(role)').map(p => p.people)[0];
          const directors = result.people.filter(p => p.role === 'directeur' || p.role === 'codirecteur').map(p => p.people);

          const info = {
            name: phdStudent.name,
            firstName: phdStudent.firstName,
            gender: phdStudent.gender ? GENDER_MAP[phdStudent.gender] : '',
            birthDate: formatDate(phdStudent.birthDate),
            //organization
            director: directors ? directors.map(d => `${d.name.toUpperCase()} ${_(d.firstName).capitalize()}`).join(',') : '',
            startDate: formatDate(result.startDate),
            endDate: formatDate(result.endDate)
            //grant
          };
          if (phdStudent.distinctions) {
            const masterAndOthers = _.sortBy(phdStudent
              .distinctions
              .filter(d => {
                return d.distinctionType === 'diplôme' && ['master','autre'].includes(d.distinctionSubtype)
              }),[d => d.date])
            const master = _.last(masterAndOthers)
            if (master)
               info.organization = master.organizations.map(o => o.name).join(',');
          }

          exportLines.push(info);
        });

        //sort by name and firstname
        exportLines = _.sortBy(exportLines, ['name', 'firstName']);

        return callback(null, exportLines);
      });
    }
  },
  {
    id: 'postdoctorantsInvites',
    name: '3.4 post-doc et invités',
    headers: [
      {key: 'name', label: 'Nom'},
      {key: 'firstName', label: 'Prénom'},
      {key: 'gender', label: 'H/F'},
      {key: 'birthDate', label: 'Date de naissance\n(1)'},
      {key: 'startDate', label: 'Date d\'arrivé dans l\'unité\n(1)'},
      {key: 'endDate', label: 'Date de départ de l\'unité\n(1)'},
      {key: 'equip', label: 'N° de l\'équipe interne de rattachement, le cas échéant\n(2)'},
      {key: 'status', label: 'statut'}
    ],
    populate(models, centerId, callback) {
      const People = models.People;
      const Activity = models.Activity;

      async.parallel({
        people: next => {
          return People.aggregate([
            {
              $match: {
                 $and: [
                    {grades: {$elemMatch: {grade: 'postdoc'}}},
                    {'academicMemberships.organization': ObjectId(centerId)}
                  ]
              }
            }], next);
        },
        activities: next => {
          return Activity
            .find({
              $and: [
                {'organizations.organization': ObjectId(centerId)},
                {activityType: 'mob_entrante'}
              ]
            })
            .populate('people.people')
            .exec(next);
        }
      }, (err, data) => {
        if (err)
          return callback(err);
        const {people, activities} = data;

        // Tagging relevant memberships
        people.forEach(person => {
          const membership = person.academicMemberships
            .find(m => '' + m.organization === centerId);

          person.relevantMembership = membership;
        });

        // Finding postdocs
        const postDocs = people
        .filter(person => {

          return (
            person.grades &&
            person.grades.length &&
            person.grades.some(grade => {
              return (
                !!grade.startDate &&
                grade.grade === 'postdoc' &&
                overlap(grade, person.relevantMembership)
              );
            })
          );
        })
        .map(person => {
          const relevantGrade = person.grades.find(grade => {
            return (
              !!grade.startDate &&
              overlap(grade, person.relevantMembership)
            );
          });

          return {
            name: person.name.toUpperCase(),
            firstName: person.firstName,
            birthDate: formatDate(person.birthDate),
            gender: GENDER_MAP[person.gender],
            startDate: formatDate(relevantGrade.startDate),
            endDate: formatDate(relevantGrade.endDate),
            status: 'post-doc'
          };
        });

        const invited = activities
          .filter(activity => {
            const role = activity.organizations
              .find(org => '' + org.organization === centerId)
              .role;

            const endDate = activity.endDate && parseDate(activity.endDate);

            return (
              activity.activityType === 'mob_entrante' &&
              role === 'orgadaccueil' &&
              (
                !endDate ||
                endDate.isSameOrAfter('2012-01-01')
              )
            );
          })
          .map(activity => {
            let person = activity.people.find(p => p.role === 'visiting')
            if (person)
              person = person.people;
            else
              return undefined
            const info = {
              name: person.name,
              firstName: person.firstName,
              birthDate: formatDate(person.birthDate),
              gender: GENDER_MAP[person.gender],
              startDate: formatDate(activity.startDate),
              endDate: formatDate(activity.endDate),
              status: 'invité.e'
            };

            return info;
          })
          .filter(i => i);
        return callback(null, postDocs.concat(invited));
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
