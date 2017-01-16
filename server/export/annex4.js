/**
 * ISARI HCERES Annex 4 Export Routine
 * ====================================
 */
var Handlebars = require('handlebars');

/**
 * Process.
 */
module.exports = {

  // 1. Activités éditoriales
  1(models, centerId, callback) {
    const People = models.People;

    function firstGroupPredicate(personalActivity) {
      return (
        personalActivity.personalActivityType === 'editorial' &&
        (
          !personalActivity.personalActivitySubtype ||
          personalActivity.personalActivitySubtype === 'revueScientifique' ||
          (
            personalActivity.personalActivitySubtype === 'collectionScientifique' &&
            personalActivity.role === 'membre'
          )
        )
      );
    }

    const secondGroupRoles = new Set(['direction', 'codirection', 'presidence']);

    function secondGroupPredicate(personalActivity) {
      return (
        personalActivity.personalActivityType === 'editorial' &&
        (
          personalActivity.personalActivitySubtype === 'collectionScientifique' &&
          secondGroupRoles.has(personalActivity.role)
        )
      );
    }

    // Finding people having an academicMembership on our center
    return People.find({
      'academicMembership.organization': centerId
    }, (err, people) => {
      if (err)
        return callback(err);

      const firstGroup = people.filter(person => {
        return (
          person.personalActivities &&
          person.personalActivities.some(firstGroupPredicate)
        );
      });

      const secondGroup = people.filter(person => {
        return (
          person.personalActivities &&
          person.personalActivities.some(secondGroupPredicate)
        );
      });

      return callback(null, 'Hello Annex4');
    });
  }
};
