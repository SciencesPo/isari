# ISARI Scripts

## Installation

Be sure to install the dependencies of the whole project before starting.

```
cd ..
npm install
```

This will install all the dependencies in a cascading fashion.

## Usage

### Importing test data

```
npm run import:test
```

### Importing the initial data

```
npm run import:init -- --path /path/to/isari_data
```

*Arguments*

* `--dry-run`: to perform a dry run that won't insert the items in the database.
* `--json`: path of a folder to dump JSON files.
* `--path`: path of ISARI data.
