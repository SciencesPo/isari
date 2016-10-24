/**
 * ISARI Test Init Import Script
 * ==============================
 *
 * Script initializing MongoDB data from pre-generated JSON data to create
 * a test base.
 */
const path = require('path'),
      async = require('async'),
      mongoose = require('../../server/node_modules/mongoose');

process.env.NODE_CONFIG_DIR = path.join(__dirname, '..', '..', 'server', 'config');

const helpers = require('./helpers');
const {
  connect,
  People,
  Organization,
  Activity
} = require('../../server/lib/model');

const peopleData = require('../../specs/data_test/people.json'),
      organizationData = require('../../specs/data_test/organizations.json'),
      activityData = require('../../specs/data_test/activities.json');

let CONNECTION;

const INDEXES = {
  Organization: Object.create(null),
  People: Object.create(null)
};

/**
 * Figuring out relations.
 */
const peopleRelations = helpers.findRelations(People.schema),
      organizationRelations = helpers.findRelations(Organization.schema),
      activityRelations = helpers.findRelations(Activity.schema);

/**
 * Data processing.
 */

// Giving an a pre-computed id to organizations to be able to solve relations
organizationData.forEach(org => {
  org._id = mongoose.Types.ObjectId();
});

// Indexing organizations
organizationData.forEach(org => {
  if (org.acronym)
    INDEXES.Organization[org.acronym] = org._id;
  else if (org.name)
    INDEXES.Organization[org.name] = org._id;
});

// Solving organizations' relations
organizationData.forEach(org => {
  helpers.processRelations(organizationRelations, org, (id, ref) => {
    const relatedItem = INDEXES[ref][id];

    if (!relatedItem)
      console.error('Could not find:', ref, id, org.name);
    else
      return relatedItem;
  });
});

// Building Mongoose objects for organizations
const organizationObjects = organizationData.map(org => {
  return (new Organization(org)).toObject();
});

// Giving an a pre-computed id to people to be able to solve relations
peopleData.forEach(person => {
  person._id = mongoose.Types.ObjectId();
});

// Indexing people
peopleData.forEach(person => {
  INDEXES.People[person.firstname + ' ' + person.name] = person._id;
});

// Solving people's relations
peopleData.forEach(person => {
  helpers.processRelations(peopleRelations, person, (id, ref) => {
    // TEMP OVERRIDE
    if (ref !== 'Organization')
      return id;

    // Finding related item
    const relatedItem = INDEXES[ref][id];

    if (!relatedItem) {
      console.error('Could not find:', ref, id, person.name);
      return id;
    }

    return relatedItem;
  });
});

// Building Mongoose objects for people
const peopleObjects = peopleData.map(person => {
  return (new People(person)).toObject();
});

// Solving activities
const activityObjects = activityData.map(activity => {

  // Solving relations
  helpers.processRelations(activityRelations, activity, (id, ref) => {
    const relatedItem = INDEXES[ref][id];

    if (!relatedItem)
      return console.error(ref, id);

    return relatedItem;
  });

  return (new Activity(activity)).toObject();
});

// Summary
console.log('Organizations:', organizationObjects.length);
console.log('People:', peopleObjects.length);
console.log('Activities:', activityObjects.length);

/**
 * Inserting.
 */
async.series({
  connect(next) {
    connect()
      .then(connection => {
        CONNECTION = connection;
        console.log('Connected to the database...');
        return next();
      })
      .catch(err => next(err));
  },

  insert(next) {
    async.parallel([
      cb => Organization.collection.insertMany(organizationObjects, cb),
      cb => People.collection.insertMany(peopleObjects, cb),
      cb => Activity.collection.insertMany(activityObjects, cb)
    ], next);
  }
}, err => {
  if (CONNECTION)
    CONNECTION.close();

  if (err)
    return console.error(err);

  console.log('Done!');
});
