# edit logs system

ISARI will need an *edit logs system* which logs every modification made in the data.  
This logs is needed to support some workflow features like post-moderation and gamification.  
Note that this logs is not intended to be used for versionning.  
Versionning will use a extrenal versionning system.

## architecture

The edit logs feature might be implemented as a [mongoose middelware](http://mongoosejs.com/docs/middleware.html).  
[Npm packages](https://www.npmjs.com/search?q=mongoose+history) already exist to cover similar issues.  
This module should keep track of which part of the data model has been modified/created/delted by who and when.  
It should keep track of modification made to ease the post-moderation feature.  
This should cover the whole scope of the data schema to allow the gamification feature.

## Post-moderation

A post-moderation system is needed to let users edit any data they have write access to while allowing central admins to monitor modifications to sensible data.  
In short:

- the [schema.metadata.json](../schema.metadata.json) file indicates through the key *accessMonitoring* which data fields are targeting to the monitoring process;
- at a frequency to be configured (typically through CRON jobs), a monitoring system inspects the *edit logs* to identify the *accessMonitoring* data fields which were modified since last report
- A report is generated (and sent by email ?) to indicate to central admins which sensible fields were modified and how

This system allow us to avoid to protect users from writing their own data while ensuring that sensible data can be monitored and checked by central admin.

## Gamification and quantifiedself

In order to leverage human data editions, a gamification system could be used as a feddback to users on how many editions they made in the system.  
For the gamification only a simple metric as number of edits could be used.  
But we can imagine much more than this like a presonnal dashbord reporting user's experience in the system.  
This leads to potential [quantified self](https://en.wikipedia.org/wiki/Quantified_Self) features.  
This area of features id not defined yet but what's for sure is that any feature in this direction will need the *edits log* system.

## soft-deletion

This system whould implement a soft-delete system.