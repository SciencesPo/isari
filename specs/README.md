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

see the schema of the [ISARI software architecture](docs/ISARI_software_architecture.svg)

# requirements

mongodb version >3.2 pour $lookup aggregate function

/!\ BeWARE OF LOOKUP limitation, maybe leave lookups to driver/ORM by query cascades ?

# Formats

## `schema.meta.json`

```json
{
  "accessType": "Restricted access field?, ex. 'confidential'",
  "label": {
    "langCode": "label for this language",
    "…": "…"
  },
  "template": "name of template function in templates.js",
  "requirement": "'mandatory' or 'recommended'",
  "accessMonitoring": "this field has special focus for logs analysis",
  "suggestions": "What type of autocomplete?",
  "description": {
    "langCode": "Description usable as a hint",
    "…": "…"
  },
  "comment": "Technical comment",
  "service": "Third-party service data is taken from",
  "//": "name.$field === Take values from field's value as a key from object enum",
  "type": {
    "string": "optional, default type",
    "text": "long string, supposedly rendered as textarea",
    "markdown": "long string, supposedly rendered as a Markdown editor",
    "boolean": "",
    "date": "3-selects date (translated into YYYY-MM-DD string field)",
    "email": "string with specific format",
    "ref": "dbref (optional, default if 'ref' is defined)"
  },
  "ref": "target collection if type is 'dbref'",
  "enum": "name of enums to take data from, see schema.enums.json, or direct list of values",
  "default": "default value",
  "min": "validation rule",
  "max": "validation rule",
  "regex": "validation rule",
  "anyOtherField": "sub-field description (recursive)"
}
```

### Types d'enum

* *Hard Enum* :
  * Config : `"enum": "enumName"`
  * Client : `isariSelect` non extensible
  * Suggestions : appel à l'API `/enums`
  * Serveur : validation `enum`
* *Soft Enum* :
  * Config : `"softenum": "enumName"`
  * Client : `isariSelect` extensible
  * Suggestions : appel à l'API `/enums`
  * Serveur : pas de validation
* *FK* :
  * Config : `"ref": "model"`
  * Client : `isariSelect` extensible (?)
    * **TODO** définir la méthode d'ajout d'un élément dans le flux de saisie (simple soumission du champ texte ne marche pas, dans `Activity` on a déjà deux champs *mandatory*)
  * Suggestions : appel à l'API `/<model>/search`
    * **TODO** définir les données retournées par le serveur en l'absence d'info *suggestions*
    * Si `"suggestions": "top_X"`, retourner les X valeurs les plus utilisées pour ce champ
  * Server : validation `DBRef`

## `schema.enums.json`

*// TODO*
