# Migration Scripts

We store in this folder scripts that must be run on updates to adapt the data model to the new code.

Those scripts rely on a comparison between a data model version stored in MongoDB & the one the script expects to update.

```
if (SCRIPT_VERSION > DATA_VERSION)
  execute()
else
  abort()
```

Old scripts can be archived to the `deprecated` folder later to optimize.
