/**
 * ISARI Import Scripts File Cleaners
 * ==================================
 *
 * Function aiming at cleaning CSV files cells before processing.
 */
exports.default = function(value) {
  return value.trim();
}
