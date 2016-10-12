# IsariNg2Frontend

## Development server
Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Fixtures

During development phase, server api are simulated.

Fixtures are in `src/app/in-memory-data.service.ts`

### Server version vs In-memory-data

Server api can be activated by :

#### 1. in ```src/app/isari-data.service.ts```

* Change an uncomment ```dataUrl```, ```layoutUrl```, ```enumUrl```
* Uncomment / comment response handle in promise return of ```getPeople```, ```getEnum``` and ```getLayout``` methods

#### 2. in ```src/app/app.module.ts```

* Comment usage of ```InMemoryWebApiModule``` : import section of the module ```InMemoryWebApiModule.forRoot(InMemoryDataService)```
