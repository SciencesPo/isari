In ISARI the data collection/edition will be supported by a series of autocompletion technics described here.

# restricted choices

## foreign key(s)

In case of fields pointing to internal objects in the data model, the autocompletion should help the user to chose an existing value.  
If a user can't find an appropriate existing value, she should be able to create a new entry seamlessly.

## enums

Enums are list of possible values used in mongoose to validate data.  
Those enums will be used to propose values to users when editing fields pointed to an enum.  
The style is still to be defined: *autocomplete of a select box ?*
Enums are a fixed list of possible values. The user can't propose any values not matching one of the existing enum. 

# open choices: suggestions

Suggestions are list of possible values which can guide the user without being a fixed list.  
The user can pick a suggestion or choose to add a different value.  
We distinguished 3 kinds of suggestions.

## harcoded suggestions

Hardcoded suggestions are list of values hardcoded in global_meta.json.  
Those values should be proposed to the user to propose a common language.  
But they don't represent all the possible cases and can then be ignored.
They can be seen as *soft enums*.

## conditional hardcoded suggestions

The contitional hardcoded suggestions are hardcoded suggestions whose possible values depends on another field value.  
examples see [global_meta.json](global_meta.json) : 

- people.personalActivity.personalActivitySubtype depends on personnalAcitvity.personalActivityType
- activity.peoples.people.role depends on activity.activityType

## top X existing value suggestions

This suggestion is used to propose the top X most used values existing in the field to be filled up.  
It aims as efficiency and convergence for fields whose a few value will be used in ~80% of cases.

