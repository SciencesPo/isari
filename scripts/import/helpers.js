/**
 * ISARI Import Scripts File Helpers
 * ==================================
 *
 * Miscellaneous helpers used by the import scripts such as foreign key
 * finders.
 */
const chalk = require('chalk'),
      _ = require('lodash');

// Simple partition by helper
exports.partitionBy = function(collection, predicate) {
  return _.values(_.groupBy(collection, predicate));
};

// Function normalizing a single name
function normalizeName(name) {
  return _.deburr(name)
    .toUpperCase()
    .replace(/[A-Z]\./g, '')
    .replace(/(?:^|\s)(\w)\s+(\w)/gi, '$1$2')
    .trim()
    .replace(/[-\s]+/g,  ' ')
    .replace(/[’‘`‛']/g, '');
}
exports.normalizeName = normalizeName;

// Function used to hash people
exports.hashPeople = function(p) {
  const name = normalizeName(p.name),
        firstName = normalizeName(p.firstName);

  return `${name}§${firstName}`;
};

exports.hashPeopleWithYear = function(p) {
  const name = normalizeName(p.name),
        firstName = normalizeName(p.firstName);

  if (p.birthDate)
    return `${name}§${firstName}§${p.birthDate.slice(0, 4)}`;
  else
    return `${name}§${firstName}`;
};

// Function checking overlap of two potentially non-ending periods.
exports.overlap = function(A, B) {
  if (!A.endDate && !B.endDate)
    return true;
  if (A.endDate > B.startDate)
    return true;
  if (A.startDate < B.startDate && A.endDate > B.endDate)
    return true;
  return false;
};

// Recursive function handling each schema level
function parseSchemaLevel(relations, level, path) {
  path = path || [];

  for (const k in level) {
    const prop = level[k];

    if (!Array.isArray(prop)) {
      if (prop.ref)
        relations.push(path.concat({plural: false, ref: prop.ref, key: k}));
      continue;
    }

    if (prop[0].ref) {
      relations.push(path.concat({plural: true, ref: prop[0].ref, key: k}));
    }
    else {
      parseSchemaLevel(relations, prop[0], path.concat({key: k}));
    }
  }
}

// Function used to describe the relations from the Mongoose schema
exports.findRelations = function(schema) {
  const tree = schema.tree,
        relations = [];

  parseSchemaLevel(relations, tree);

  return relations;
};

// Function used to access the desired path in an item
function recurseIntoItem(path, item, callback) {

  // Leaf
  if (path.length === 1) {
    const {plural, key, ref} = path[0];

    if (!item[key])
      return;

    // Singular
    if (!plural) {
      item[key] = callback(item[key], ref);
    }

    // Plural
    else {
      for (let i = 0, l = item[key].length; i < l; i++) {
        item[key][i] = callback(item[key][i], ref);
      }
    }
  }

  // Not leaf
  else {
    item = item[path[0].key];
    path = path.slice(1);

    if (!item)
      return;

    for (let i = 0, l = item.length; i < l; i++) {
      recurseIntoItem(path, item[i], callback);
    }
  }
}

// Function used to iterate over the described relations of an item
exports.processRelations = function(relations, item, callback) {

  // Iterating over relations
  for (let i = 0, l = relations.length; i < l; i++) {
    const path = relations[i];

    recurseIntoItem(path, item, callback);
  }
};

// Function used to recursively collect schema validation errors
const collectErrors = function(error, index, path = [], acc = []) {

  // Leaf?
  if (!error.reason && !error.errors && error.kind !== 'ObjectId') {
    const meta = {
      line: index + 1,
      type: error.name,
      message: error.message || '',
      path
    };

    const coloredMessage = meta.message
      .replace(/`(.*?)`/g, function($, m) {
        return chalk.cyan(m);
      })
      .replace(/".*?"/g, function(m) {
        return chalk.green(m);
      });

    meta.formattedMessage = `Line ${meta.line}: ${meta.type} => ${coloredMessage}`;

    acc.push(meta);
  }

  // Recurse
  else {
    if (error.reason) {
      collectErrors(error.reason, index, path.concat(error.path), acc);
    }
    else if (error.errors) {
      for (const k in error.errors) {
        collectErrors(error.errors[k], index, path.concat(error.errors[k].path), acc);
      }
    }
  }


  return acc;
};

exports.collectErrors = collectErrors;
