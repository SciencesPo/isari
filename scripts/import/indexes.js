/**
 * ISARI Import Scripts Indexes
 * =============================
 *
 * Miscellaneous static indexes generated mostly from enums.
 */
const keyBy = require('lodash/keyBy');

const COUNTRIES = require('../../specs/enum.countries.json');

exports.ENUM_INDEXES = {
  countries: {
    alpha3: keyBy(COUNTRIES, 'alpha3')
  }
};
