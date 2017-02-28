///////////////////////////////////// DATA IMPORT /////////////////////////////////////






// Procedures needed to import data from global_enum and global_json

var mongoose = require('mongoose');
var enums = require('./data_specs/global_enum.json');
var fs = require('fs');






// Objects imported from the global_schema

var People = require('./data_specs/global_schema');
var Organization = require('./data_specs/global_schema');
var Activity = require('./data_specs/global_schema');






////////////////////////////////// DATA CONVERTING //////////////////////////////////






// Converting global_schema 's objects into JSON stuff

var peopleConverted = JSON.stringify(People.schema.tree, null, "\t");
var organizationConverted = JSON.stringify(Organization.schema.tree, null, "\t");
var activityConverted = JSON.stringify(Activity.schema.tree, null, "\t");





//////////////////////////////////// DATA WRITING ////////////////////////////////////






// Writing method to catch the JSON files from global_schema

fs.writeFile('peopleschema.json',peopleConverted, function (err) {
  if (err) return console.log(err);
  console.log(' peopleSchema inserted into > peopleschema.json');
});
fs.writeFile('organizationschema.json',organizationConverted, function (err) {
  if (err) return console.log(err);
  console.log(' organizationSchema inserted into > organizationschema.json');
});
fs.writeFile('activityschema.json',activityConverted, function (err) {
  if (err) return console.log(err);
  console.log(' activitySchema inserted into > activityschema.json');
});






///////////////////////////////////////// END /////////////////////////////////////////




