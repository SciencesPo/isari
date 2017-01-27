/**
 * ISARI Import Scripts File Cleaners
 * ==================================
 *
 * Function aiming at cleaning CSV files cells before processing.
 */
const CARRIAGE_NORMALIZATION = /(?:\r\n|\n\r|\n|\r)/g,
      CARRIAGE_SUPPRESSION = /\s*\n\s*/g,
      SINGLE_QUOTES = /[’‘`‛']/g,
      DOUBLE_QUOTES = /[«»„‟“”"]/g,
      UNICODE_HYPHEN = /–/g,
      // ELLIPSIS = /…/g,
      WHITESPACES = /\s+/g;

exports.default = function(value) {
  return value
    .trim()
    .replace(CARRIAGE_NORMALIZATION, '\n')
    .replace(CARRIAGE_SUPPRESSION, ' ')
    .replace(SINGLE_QUOTES, '\'')
    .replace(DOUBLE_QUOTES, '"')
    // .replace(ELLIPSIS, '...')
    .replace(UNICODE_HYPHEN, '-')
    .replace(WHITESPACES, ' ');
};
