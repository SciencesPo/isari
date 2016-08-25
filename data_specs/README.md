ISARI mongodb data model

# requirements

mongodb version >3.2 pour $lookup aggregate function

/!\ BeWARE OF LOOKUP limitation, maybe leave lookups to driver/ORM by query cascades ?

# collections

- people
- position
- organisation
- activities
- métadonnées / nomenclatures /!\ :
	champs normé, listes de valeurs, champs obligatoire/souhaité, privé, labels, clef
- tags : on peut tout tagguer !

- est ce qu'on a plusieurs noms pour une orga ? 

# naming



https://scanr.enseignementsup-recherche.gouv.fr/


# datahub 

on stocke une copie de la série datahube dans une collection mongo.
