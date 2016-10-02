# Versionning system

ISARI will have a versionning system.  
This versionning system will keep track of versions of the complete dataset at a precision to be defined.  
This system has to : 

- version any modification at a data field level
- isolate versions at a document level
- record modification at a defined time frequency (commit units ?)

## architecture

To keep it simple and sorted, the first shot would do the following:

- trigger the versionning system at a stable frequency (daily)
- the versionning system will:
	- exports the mongodb into json flat files in a git repository
	- correctly indent those files to isolate one data field by line
	- convert collections as file directories
	- write one json file by document using mongo IDs as filenames
	- trigger a git commit

Thus the git repository used would allow to keep track of daily snapshots of the database.  
To be complete this versionning system has to have a from_git_to_mongo script to be able to rollback to a defined commit.

## possible future developments

Merge the versionning system with the edit logs one to reduce the commit units to the smallest edit level.  
This would allow to trigger commits lively and would open the opportunity to use ISARI users as git authors.  
This is science fiction for now.