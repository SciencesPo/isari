/**
 * ISARI Import Scripts Clustering
 * ================================
 *
 * Function used to cluster people & organizations' names.
 */
const words = require('talisman/tokenizers/words'),
      naiveClusterer = require('talisman/clustering/record-linkage/naive'),
      fingerprint = require('talisman/keyers/fingerprint'),
      overlap = require('talisman/metrics/distance/overlap'),
      jaccard = require('talisman/metrics/distance/jaccard');

const helpers = require('./helpers');

/**
 * Similarity metrics.
 */
const peopleSimilarity = (a, b) => {
  return overlap(a.key, b.key) === 1;
};

const organizationSimilarity = (a, b) => {
  return jaccard(a.key, b.key) >= 3 / 4;
};

/**
 * People.
 */
exports.people = function(people) {

  // Tokenizing
  people = people.map(person => {
    const key = words(helpers.normalizeName(person.name))
      .concat(words(helpers.normalizeName(person.firstName)));

    return {
      key,
      person
    };
  });

  return naiveClusterer({similarity: peopleSimilarity}, people)
    .filter(cluster => cluster.length > 1)
    .map(cluster => cluster.map(item => item.person));
};

/**
 * Organizations.
 */
exports.organizations = function(organizations) {

  // Tokenizing
  organizations = organizations.map(org => {
    return {
      key: fingerprint(org.name).split(' '),
      org
    };
  });

  return naiveClusterer({similarity: organizationSimilarity}, organizations)
    .filter(cluster => cluster.length > 1)
    .map(cluster => cluster.map(item => item.org));
};
