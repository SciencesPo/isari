# Isari Server

## REST API (**WIP**)

### Collection endpoints:

* `GET /:collection`
  * input: none
  * output: Array(Item) or 404
* `GET /:collection/:id`
  * input: none
  * output: Item or 404
* `POST /:collection`
  * input: full Item
  * output: Item + 201 or 400
* `PUT /:collection/:id`
  * input: partial Item (id + fields to update)
  * output: Item + 200 or 400
* `DELETE /:collection/:id`
  * input: none
  * output: 204
* `GET /:collection/search`
  * Fuzzy-matching endpoint for autocomple
  * input:
    * `?q=…` specifies the query, like input's value (mandatory)
    * `?fields=…` lists the fields we're supposed to look into (optional)
  * output: Array(AutoCompleteItem)

**Valid collections**:

* `people`
* `organizations`
* `activities`

#### Format: `Item`

* See `schema.meta.json` for model description
* Add `id` (Mongo ID)
* Add `opts` which includes frontend-metadata:
  * `editable` (boolean) indicates if user has permission to edit the fetched object

#### Format: `AutoComplete`

WIP

Should be the same as Item

### Meta endpoints

* `GET /schemas/:name`
  * Returns the schema description, formatted for frontend needs (**WIP**)
  * for convenience `name` is not case sensitive (i.e. `People` or `people` will do)
  * Note that fields `id` and `opts` are never specified in schema, however they're included in any collection item returned by API
  * **Valid names**: same as collections
* `GET /enums/:name`
  * Returns data found for key in `schema.enums.json`, maybe formatted for frontend needs (**WIP**)
  * Can be an array of strings (value === label)
  * Can be an array of objects with key `value` and `label` (can be multilingual)
  * Can be an object in case of inter-dependant fields (see personalActivityType and personalActivitySubType)
  * **Valid names**: see `schema.enums.json`
* `GET /layouts/:name`
  * Returns the layout description to render forms (**WIP**)
  * for convenience `name` is not case sensitive (i.e. `People` or `people` will do)
  * **Valid names**: all collections + specific layouts
