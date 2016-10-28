/**
 * ISARI Import Scripts File Cleaners
 * ==================================
 *
 * Function aiming at cleaning CSV files cells before processing.
 */
const CARRIAGE_NORMALIZATION = /(?:\r\n|\n\r|\n|\r)/g,
      CARRIAGE_SUPPRESSION = /\s*\n\s*/g;

exports.default = function(value) {
  return value
    .trim()
    .replace(CARRIAGE_NORMALIZATION, '\n')
    .replace(CARRIAGE_SUPPRESSION, ' ');
};
