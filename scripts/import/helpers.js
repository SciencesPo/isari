/**
 * ISARI Import Scripts File Helpers
 * ==================================
 *
 * Miscellaneous helpers used by the import scripts such as foreign key
 * finders.
 */

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
