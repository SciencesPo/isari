// notes about mongo queries used to solve the issue of missing org ID in Object due to th bug in deletion protection
// not a working script, ketp here for history/reminders of what was done.

db.getSiblingDB("isaridev").getCollection("people").find({"distinctions.organizations":ObjectId("5894889b11d0d100381bcdce")});
db.getCollection("people").updateMany({"distinctions.organizations":ObjectId("5894889b11d0d100381bcdce")},{$addToSet:{'distinctions.$.organizations':ObjectId("5894889b11d0d100381bd3c7")}});
db.getCollection("people").updateMany({"distinctions.organizations":ObjectId("5894889b11d0d100381bcdce")},{$pull:{'distinctions.$.organizations':ObjectId("5894889b11d0d100381bcdce")}});


db.getCollection("people").find({"personalActivities.organizations":ObjectId("5894889b11d0d100381bcdce")});
db.getCollection("people").updateMany({"personalActivities.organizations":ObjectId("5894889b11d0d100381bcdce")},{$addToSet:{'personalActivities.$.organizations':ObjectId("5894889b11d0d100381bd3c7")}});
db.getCollection("people").updateMany({"personalActivities.organizations":ObjectId("5894889b11d0d100381bcdce")},{$pull:{'personalActivities.$.organizations':ObjectId("5894889b11d0d100381bcdce")}});





db.getSiblingDB("isaridev").getCollection("people").aggregate([
    {$unwind:'$distinctions'},
  {$unwind:'$distinctions.organizations'},
  {$match:{'distinctions.organizations':{$exists:true,'$ne':null}}},
  {$lookup:{
   from:'organizations',
   localField:'distinctions.organizations',
   foreignField:'_id',
   as:'distOrg'
  }},
 {$match:{'distOrg':{$exists:true,$size:0}}},
{$project:{'missingOrg':'$distinctions.organizations'}},
{$group:{_id:'$missingOrg'} }])


{ "_id" : ObjectId("5894889b11d0d100381bd196") }   "Université De Sienne" "2441/1hitrvaeol931ouio9ko046cep" "5894889b11d0d100381bd126"
{ "_id" : ObjectId("5894889b11d0d100381bcdce") }  EHESS => "5894889b11d0d100381bd3c7"


db.getSiblingDB("isaridev").getCollection("people").aggregate([
    {$unwind:'$personalActivities'},
  {$unwind:'$personalActivities.organizations'},
  {$match:{'personalActivities.organizations':{$exists:true,'$ne':null}}},
  {$lookup:{
   from:'organizations',
   localField:'personalActivities.organizations',
   foreignField:'_id',
   as:'distOrg'
  }},
 {$match:{'distOrg':{$exists:true,$size:0}}},
{$project:{'missingOrg':'$personalActivities.organizations'}},
{$group:{_id:'$missingOrg'} }])

{ "_id" : ObjectId("59157dac6da2fb000150de80") } => chaire replaced by an activity object 
{ "_id" : ObjectId("5894889b11d0d100381bcdce") } EHESS



db.getSiblingDB("isaridev").getCollection("activities").aggregate([
    {$unwind:'$organizations'},
  {$match:{'organizations.organization':{$exists:true,'$ne':null}}},
  {$lookup:{
   from:'organizations',
   localField:'organizations.organization',
   foreignField:'_id',
   as:'distOrg'
  }},
 {$match:{'distOrg':{$exists:true,$size:0}}},
{$project:{'missingOrg':'$organizations.organization'}},
{$group:{_id:'$missingOrg'} }])