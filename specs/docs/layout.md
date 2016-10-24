#layout syntax

3 groupes :
- le 1er est détaillé et "collapsable"
- le 2eme est juste un regroupement de 2 champs
- le 3eme consiste juste en 1 champ

```json
[
 {
   "label": {"fr":"group 1","en":"group One"},
   "collapsabled": true,
   "fields": ["firstname", "lastname"]
 },
 ["gender", "birthdate"],
 "nationalities"
]
```

