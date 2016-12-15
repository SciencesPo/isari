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


exports.ENUM_INDEXES = {
  countries: {
    alpha3: keyBy(COUNTRIES, 'alpha3')
  },
  grades: {
    admin: GRADE_ADMIN,
    technique: GRADE_TECHNIQUE
  }
};
