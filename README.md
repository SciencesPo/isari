# ISARI

ISARI is a web application which helps univeristies to report research activities.
This project will licensed under [AGPLv3](LICENSE.md).

## data model

We defined a data model although we use a nosql database to frame the User Interface generation (forms, validation, access...).  
We use this set of files to descrie Isari data model : 

- [global_schema.js](data_specs/global_schema.js): a mongoose data model js file which describe data objects.
- [global_meta.json](data_specs/global_meta.json): a json file listing metadata for each data attributes. This file list :
	
	- labels in fr and en
	- requirements: mandatory or recommended
	- accessType: specific access type
	- suggestions: the method to use to suggest input values (/!\ work in progress)

- [global_enum.json](data_specs/global_enum.json): a json file which list values for controlled data attributes
- [role_access.json](data_specs/role_access.json): a json file which describes roles and access types see [role_access.md](role_access.md)

## technical infrastructure

Data are stored in a **MongoDB** through **mongoose**.

We use **mongo-connector** to index those data in a **elasticsearch** engine.

A **nodejs** server using **mongoose** deliver a **REST** API through **express** (or **Dolman** ?).

A web client coded in **angular2** proposes data edition and exploration feeatures.






