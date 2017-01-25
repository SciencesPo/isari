module.exports = {
  Organization: org => org.name,
  People: person => `${person.firstName} ${person.name}`,
  Activity: activity => activity.name
}
