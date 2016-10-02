# ISARI specifications 

# data model

We defined a data model although we use a nosql database to frame the User Interface generation (forms, validation, access...).  
We use this set of files to descrie Isari data model : 

- [schema.js](schema.js): a mongoose data model js file which describe data objects.
- [schema_meta.json](schema.meta.json): a json file listing metadata for each data attributes. This file list :
	
	- labels in fr and en
	- requirements: mandatory or recommended
	- accessType: specific access type
	- suggestions: the method to use to suggest input values (see [autocompletion.md](docs/autocompletion.md))
	- accessMonitoring: a tag indicating the monitoring group (see [editLogs.md](docs/editLogs.md)) this fields belongs to. It implies that corresponding fields should be monitored and should trigger sepcific action when modified (report for post-moderation).  

- [schema.enums.json](schema.enums.json): a json file which list values for controlled data attributes
- [role_access.json](role_access.json): a json file which describes roles and access types see [role_access.md](docs/role_access.md)

# key features

Check those documentation about key features:

- [autocompletion](docs/autocompletion.md)
- [edit logs](docs/editlogs.md)
- [versionning](docs/versionning.md) 

# software architecture

Data are stored in a **MongoDB** through **mongoose**.  
We use **mongo-connector** to index those data in a **elasticsearch** engine.  
A **nodejs** server using **mongoose** deliver a **REST** API through **express**.  
A web client coded in **angular2** proposes data edition and exploration feeatures.

![ISARI software architecture](docs/ISARI_software_architecture.svg)

# requirements

mongodb version >3.2 pour $lookup aggregate function

/!\ BeWARE OF LOOKUP limitation, maybe leave lookups to driver/ORM by query cascades ?
