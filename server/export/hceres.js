/**
 * ISARI HCERES Export Routine
 * ============================
 */
const async = require('async'),
      moment = require('moment'),
      mongoose = require('mongoose'),
      _ = require('lodash');

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
            organization: ObjectId(centerId)
          }
        }
      })

      .unwind('positions')
      .lookup({
          from: 'organizations',
          localField: 'positions.organization',
          foreignField: '_id',
          as: 'tutelles'
        })
      .unwind('tutelles')
      .group({
        _id: '$_id',
        academicMemberships: {$first: '$academicMemberships'},
        tutelles: {$push: '$tutelles'},
        positions: {$push: '$positions'},
        grades: {$first: '$grades'},
        name: {$first: '$name'},
        firstName: {$first: '$firstName'},
        gender: {$first: '$gender'},
        tags: {$first: '$tags'},
        birthDate: {$first: '$birthDate'},
        distinctions: {$first: '$distinctions'}
      })
      .then(people => {

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

          if (person.tutelles && person.tutelles.find(t => t.acronym === 'CNRS'))
            info.organization = 'CNRS';

          const grade = findRelevantItem(person.grades);

          if (grade) {
            if (GRADES_INDEX[grade.gradeStatus] && GRADES_INDEX[grade.gradeStatus][grade.grade]) {
              info.jobType = GRADES_INDEX[grade.gradeStatus][grade.grade].type_emploiHCERES;
              info.grade = GRADES_INDEX[grade.gradeStatus][grade.grade].gradeHCERES;
            }
            else {
              // grade not found in translation index let's try the gradeDRH
              const position = findRelevantItem(person.positions);

              if (position && position.gradesSirh) {
                const relevantGradeDRH = findRelevantItem(position.gradesSirh);

                if (relevantGradeDRH && GRADES_INDEX.gradeDRH[relevantGradeDRH.grade]) {
                  info.jobType = GRADES_INDEX.gradeDRH[relevantGradeDRH.grade].type_emploiHCERES;
                  info.grade = GRADES_INDEX.gradeDRH[relevantGradeDRH.grade].gradeHCERES;
                }
                else {
                  // not found at all => out
                  //remove from export by returning and removing those case by a compact
                  return;
                }
              }
              else {
                  // no grade DRH ?
                  info.jobType = '????';
                  info.grade = '????';

                }
            }
            info.startDate = grade.startDate;
          }

          if (person.birthDate) {
            info.birthDate = formatDate(person.birthDate);
          }

          if (person.distinctions && person.distinctions.some(d => d.title === 'HDR'))
            info.hdr = 'OUI';

          return info;
        })
        // removing empty cases
        .compact().value();

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

        const exportLines = [];

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
            const master = phdStudent.distinctions.filter(d => d.distinctionType === 'diplôme' && d.distinctionSubtype === 'master')[0];
            if (master)
               info.organization = master.organizations.map(o => o.name).join(',');
          }

          exportLines.push(info);
        });

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
      {key: 'equip', label: 'N° de l\'équipe interne de rattachement, le cas échéant\n(2)'}
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
            birthDate: person.birthDate,
            gender: GENDER_MAP[person.gender],
            startDate: relevantGrade.startDate,
            endDate: relevantGrade.endDate
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
            const person = activity.people.find(p => p.role === 'visiting').people;

            const info = {
              name: person.name,
              firstName: person.firstName,
              birthDate: person.birthDate,
              gender: GENDER_MAP[person.gender],
              startDate: activity.startDate,
              endDate: activity.endDate
            };

            return info;
          });
        return callback(null, postDocs.concat(invited));
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
