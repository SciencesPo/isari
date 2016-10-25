# Syntaxe `layout.*.json`

## Nom du fichier

Le nom du fichier est composé du nom complet du champ, par exemple `layout.people.personalActivities.json` pour représenter le layout du sous-objet `personalActivities` du modèle `People`. Pas de différence de nommage que le champ soit multi-valué ou pas.

Un fichier de layout ne définit qu'un niveau de formulaire, pour le cas des sous-objets il **faut** passer par un second fichier avec nom imbriqué.

## Format du fichier

Le fichier représente des "lignes" de formulaires, chaque ligne représentant un ou plusieurs champs :

```js
[
  ligne1,
  ligne2,
  ligne3
]
```

### Lignes de champs

Une ligne définit la liste des champs affiché dans le même groupe (a priori sur la même ligne), exemple complet :

```js
[
  // Mode simple
  "nomDuChamp",

  // Mode simple, multiples champs
  [ "nomDuChamp1", "nomDuChamp2" ],

  // Mode détaillé
  {
    "fields": [ "nomDuChamp3", "nomDuChamp4" ],
    "label": {
      "lang": "Label"
    },
    "collapsabled": true // false par défaut
  }
]
```

**ATTENTION** les commentaires ci-dessus sont réservés à la documentation, le format JSON ne les permet pas.

### Champs additionnels

Par défaut, tous les champs du modèle non spécifiés dans le layout seront ajoutés au formulaire, un par ligne.

### Champs exclus

Pour exclure un champ, il suffit de l'inclure dans le layout en le préfixant par un tiret, exemple :

```js
[
  "champInclus",
  "-champExclus"
]
```
