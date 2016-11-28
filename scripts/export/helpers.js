/**
 * ISARI Export Script Helpers
 * ============================
 *
 * Miscellaneous functions related to export and XLSX generation.
 */
const XLSX = require('xlsx');

/**
 * Function creating a workbook in the format expected by the js-xlsx library.
 */
exports.createWorkbook = function() {
  return {
    Sheets: {},
    SheetNames: []
  };
};

/**
 * Function taking a collection and returning a sheet in the format expected
 * by the js-xlsx library.
 */
exports.createSheet = function(headers, collection) {
  const sheet = {},
        range = {
          s: {c: Infinity, r: Infinity},
          e: {c: -Infinity, r: -Infinity}
        };

  const headerLine = {};

  headers.forEach(({key, label}) => {
    headerLine[key] = label;
  });

  collection = [headerLine].concat(collection);

  for (let R = 0, l = collection.length; R < l; R++) {
    const line = collection[R];
    let C = 0;

    for (let i = 0, m = headers.length; i < m; i++) {
      const k = headers[i].key;

      // Updating range
      if (range.s.r > R) {
        range.s.r = R;
      }
      if (range.s.c > C) {
        range.s.c = C;
      }
      if (range.e.r < R) {
        range.e.r = R;
      }
      if (range.e.c < C) {
        range.e.c = C;
      }

      const value = line[k] || '',
            address = XLSX.utils.encode_cell({c: C, r: R}),
            cell = {v: value};

      sheet[address] = cell;

      C++;
    }
  }

  sheet['!ref'] = XLSX.utils.encode_range(range);

  return sheet;
};

/**
 * Function adding a sheet to a workbook.
 */
exports.addSheetToWorkbook = function(workbook, sheet, name) {
  workbook.Sheets[name] = sheet;
  workbook.SheetNames.push(name);
};
