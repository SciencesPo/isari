/* eslint-disable */
/**
 * ISARI Import Scripts Clustering
 * ================================
 *
 * Function used to cluster people & organizations' names.
 */
const words = require('talisman/tokenizers/words'),
      naiveClusterer = require('talisman/clustering/record-linkage/naive'),
      keyCollision = require('talisman/clustering/record-linkage/key-collision'),
      fingerprint = require('talisman/keyers/fingerprint'),
      // fingerpintTokenizer = require('talisman/tokenizers/fingerprint'),
      overlap = require('talisman/metrics/distance/overlap'),
      jaccard = require('talisman/metrics/distance/jaccard'),
      levenshtein = require('talisman/metrics/distance/levenshtein');

const helpers = require('./helpers');

/**
 * Special keyer.
 */
// const IEPKeyer = name => {
//   const tokens = fingerpintTokenizer(name.replace(/sciences\s*po/ig, 'IEP'));

//   return tokens.join(' ');
// };

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
  // people = people.map(person => {
  //   const key = words(helpers.normalizeName(person.name))
  //     .concat(words(helpers.normalizeName(person.firstName)));

  //   return {
  //     key,
  //     person
  //   };
  // });

  return naiveClusterer({similarity: (a, b) => levenshtein(helpers.hashPeople(a), helpers.hashPeople(b)) <= 2}, people)
    // .map(cluster => cluster.map(item => item.person));
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
    .map(cluster => cluster.map(item => item.org));
};

// exports.organizations = function(organizations) {
//   return keyCollision({
//     key: org => IEPKeyer(org.name)
//   }, organizations);
// };
