/**
 * ISARI Test Init Import Script
 * ==============================
 *
 * Script initializing MongoDB data from pre-generated JSON data to create
 * a test base.
 */
const path = require('path');

process.chdir(path.join(__dirname, '..', '..', 'server'));

const {
  connect,
  People,
  Organization,
  Activity
} = require('../../server/lib/model');

const peopleData = require('../../specs/data_test/people.json'),
      organizationData = require('../../specs/data_test/organizations.json'),
      activityData = require('../../specs/data_test/activities.json');
