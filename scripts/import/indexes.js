/**
 * ISARI Import Scripts Indexes
 * =============================
 *
 * Miscellaneous static indexes generated mostly from enums.
 */
const keyBy = require('lodash/keyBy');

const COUNTRIES = require('../../specs/enum.countries.json'),
      NESTED_ENUMS = require('../../specs/enums.nested.json'),
      ENUMS = require('../../specs/enums.json');

const GRADE_ADMIN = new Set(NESTED_ENUMS.grade.appuiadministratif.map(g => g.value)),
      GRADE_TECHNIQUE = new Set(NESTED_ENUMS.grade.appuitechnique.map(g => g.value)),
      GRADE_ACADEMIQUE = {};
      GRADE_SIRH = {};

for (const k in NESTED_ENUMS.grade) {
  if (k === 'appuiadministratif' || k === 'appuitechnique')
    continue;

  NESTED_ENUMS.grade[k].forEach(g => (GRADE_ACADEMIQUE[g.value] = k));
}

ENUMS.gradesSirh.forEach(e => {
  GRADE_SIRH[e.value]=e.label.fr
});

exports.ENUM_INDEXES = {
  countries: {
    alpha3: keyBy(COUNTRIES, 'alpha3')
  },
  grades: {
    admin: GRADE_ADMIN,
    technique: GRADE_TECHNIQUE,
    academique: GRADE_ACADEMIQUE,
    sirh: GRADE_SIRH
  }
};
