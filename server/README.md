# Isari Server

## requirements

* node.js >=v6.7
* mongodb + mongo-connector - see [dev_docker](./dev_docker)
* Elasticsearch - see [dev_docker](./dev_docker)

## Configuration

* Configuration files use `TOML` (INI on steroids) format and are located in `config` folder
* `default.toml` is the main configuration file
* You can override default options in `$NODE_ENV.toml`
* You can override default and env-specific options in `local.toml` (unversionned)

## Development

```sh
npm install
```

* `npm run start-db` starts the Docker image with combined MongoDB and ElasticSearch
	* `npm run clean-db` clears the image
* `npm run dev` starts all these sub-tasks in parallel:
	* `watch:server` runs `server.js` in *development* environment, restarts on every change
	* `watch:lint` runs ESLint validation on every change
	* `watch:test` runs unit tests on every change
* `npm test` runs unit tests
* `npm run lint` runs ESLint validation

## Production

```sh
npm install --production
```

* `npm start` starts `server.js` in *production* environment

## REST API

### Authentication

* `GET /auth/myself`
	* output: `{ login, people }`
		* `login`: LDAP UID
		* `people`: populated matching People
* `POST /auth/login`
	* input: `{ login, password }`
	* output: `{ login, people }` (cf. route `/auth/myself`)
* `POST /auth/logout`
	* output: `{ was }`
		* `was`: login of previously logged in user
* `GET /auth/permissions`
	* output: `{ central, organizations }`
		* `central`: boolean telling if logged user is central
		* `organizations`: array of organizations (see schema) with added `isariRole` item, telling which role user has in this organization

### Collection endpoints

* `GET /:collection`
	* output: Array(Item) or 404
	* options:
		* `fields`: comma-separated list of fields to include in response (default: all)
		* `applyTemplates`: set to 1 will transform response's fields into their string representations (default: 0)
* `GET /:collection/:id`
	* output: Item or 404
* `GET /:collection/:ids/string`
	* `ids`: comma-separated list of valid objectIds
	* output: `Array({id, value})`
		* `id`: object's id
		* `value`: object's string representation
		* throws 404 if *any* ID can't be found
		* throws 400 if *any* ID is syntactically invalid
		* order is preserved
* `POST /:collection`
	* input: full Item
	* output: Item + 201 or 400
* `PUT /:collection/:id`
	* will **replace** item in database
	* input: full Item
	* output: Item + 200 or 400
* `DELETE /:collection/:id`
	* throws 400 if the item still has relations
	* output: 204
* `GET /:collection/:id/relations`
	* output: formatted items (strings probably)
* `GET /:collection/search`
	* Endpoint for autocomplete suggestions
	* output: Array(AutoCompleteItem) or Array(Item)
	* options:
		* `q`: search terms, note that quotes are not supported in current version (mandatory)
		* `fields`: comma-separated list of fields to limit search to (default: all)
		* `full`: set to 1 to get full items instead of auto-complete items (default: 0)
		* `raw`: set to 1 to use query-string as-is (default: 0, query-string is transformed to enable prefix-search and fuzziness)
		* Used on 'ref' fields for suggestions based on top used values:
			* `path`: the path of the field we ask suggestions for (e.g. `positions.3.organization` or `parentOrganizations.0`)
			* `sourceModel`: the name of the model containing the asked path (e.g. `People` or `Organization`) while the index we're querying to get results is given by `:collection`
			* `rootFeature`: the name of the frontend feature to be translated into `sourceModel` if the latter is not provided (e.g. `people` or `organizations`)

**Valid collections**:

* `people`
* `organizations`
* `activities`

#### Query-string options

* `/:collection/*?organization=ID`: If you're not connected as central admin or central reader, you will need to specifiy the *scope* of your query with this option
* `/people?include=TYPE`: Specify which type of people you want to include in results:
  * `externals`: only externals
  * `members`: only members
  * `both`: externals + members
  * `range`: only members within given dates (**additionally requires options `organization`, `start` and `end`**)

#### Format: `Item`

* See `specs/README.md` for model description
* Add `id` (Mongo ID)
* Add `opts` which includes frontend-metadata:
	* `editable` (boolean) indicates if user has permission to edit the fetched object

#### Format: `AutoCompleteItem`

```json
{
	"value": "ID",
	"label": "string representation"
}
```

### Meta endpoints

* `GET /schemas/:name`
	* Returns the schema description, formatted for frontend needs (**WIP**)
	* for convenience `name` is not case sensitive (i.e. `People` or `people` will do)
	* Note that fields `id` and `opts` are never specified in schema, however they're included in any collection item returned by API
	* **Valid names**: same as collections
* `GET /enums/:name`
	* Returns data found for key in `enums.json`, maybe formatted for frontend needs (**WIP**)
	* Can be an array of strings (value === label)
	* Can be an array of objects with key `value` and `label` (can be multilingual)
	* Can be an object in case of inter-dependant fields (see personalActivityType and personalActivitySubType)
	* **Valid names**: see `enums.json`
* `GET /layouts/:name`
	* Returns the layout description to render forms (**WIP**)
	* for convenience `name` is not case sensitive (i.e. `People` or `people` will do)
	* **Valid names**: all collections + specific layouts
