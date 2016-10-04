# Isari Server

## REST API (**WIP**)

### Collection endpoints:

* `GET /:collection`
* `GET /:collection/:id`
* `POST /:collection`
* `PUT /:collection/:id`
* `DELETE /:collection`
* `GET /:collection/search`
	* Fuzzy-matching endpoint for autocomple
	* `?q=…` specifies the query, like input's value (mandatory)
	* `?fields=…` lists the fields we're supposed to look into (optional)

**Valid collections**:

* `people`
* `organizations`
* `activities`

### Meta endpoints

* `GET /schemas/:name`
	* Returns the schema description, formatted for frontend needs (**WIP**)
	* for convenience `name` is not case sensitive (i.e. `People` or `people` will do)
	* Note that field `id` is never specified in schema, however it's included in any collection item returned by API
	* **Valid names**: same as collections
* `GET /enums/:name`
	* Returns data found for key in `schema.enums.json`, maybe formatted for frontend needs (**WIP**)
	* Can be an array of strings (value === label)
	* Can be an array of objects with key `value` and `label` (can be multilingual)
	* Can be an object in case of inter-dependant fields (see personalActivityType and personalActivitySubType)
	* **Valid names**: see `schema.enums.json`
