/**
 * ISARI Import Scripts Indexes
 * =============================
 *
 * Miscellaneous static indexes generated mostly from enums.
 */
const keyBy = require('lodash/keyBy');

const COUNTRIES = require('../../specs/enum.countries.json'),
      NESTED_ENUMS = require('../../specs/enums.nested.json');

const GRADE_ADMIN = new Set(NESTED_ENUMS.grade.appuiadministratif.map(g => g.value)),
      GRADE_TECHNIQUE = new Set(NESTED_ENUMS.grade.appuitechnique.map(g => g.value));

let GRADE_ACADEMIQUE = {};

for (const k in NESTED_ENUMS.grade) {
  if (k === 'appuiadministratif' || k === 'appuitechnique')
    continue;

  NESTED_ENUMS.grade[k].forEach(g => GRADE_ACADEMIQUE[g.value] = k);
}

exports.ENUM_INDEXES = {
  countries: {
    alpha3: keyBy(COUNTRIES, 'alpha3')
  },
  grades: {
    admin: GRADE_ADMIN,
    technique: GRADE_TECHNIQUE,
    academique: GRADE_ACADEMIQUE
  }
};
