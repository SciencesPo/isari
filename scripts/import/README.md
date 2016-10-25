# Import Scripts

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

## Process

1. Consume files & produce proto-objects
2. Consistency checks & matching (use Schema helpers to validate?)
3. Generate full indexes with pre-generated mongo ids
4. Relation solving
5. Create Mongoose instances.
6. Insertion
