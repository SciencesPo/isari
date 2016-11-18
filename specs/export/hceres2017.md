
# Bilan : données du contrat en cours

## onglet 2 : composition de l'unité

## onglet 3.2 : liste des personnels

filtre des peoples :
- academicMembership sur le centre à la date 30/06/2017
- jobType != "stage"
- gradeAcademic en cours not in ["postdoc","doctorant(grade)"]

remplissage
- Type d'emploi : déduit du grade par les tables de correspondances
- nom, prénom, genre, date de naissance
- corps grade : grade
- panel disciplianaire : tag HCERES 2017
- HDR : distinction
- employeur nom + UAI : orga de la position en cours  (on met quoi dans le cas de ministère ?)
- ministère : orga de la position en cours 
- date d'arrivée dans l'unité : start_date academicMemebrship
- participation au projet : Demander à Sophie
- ORCID

## onglet 3.3 : docteurs et doctorants

filtre des people : 
- gradeAcademic = doctorant(grade)
- et academicMembership = labo
- et gradeAcademic et academicMembership qui se recouvrent
- gradeAcademic.endDate >= 1/1/2012 ou endDate vide 

récupérer les activités de type doctorat :
si people in activity.people et role = "doctorant(role)"

- nom, prénom, genre, date de naissance
- établissement ayant délivré le master : 
    + l'orga de la distinction du people qui précède le doctorat
- directeurs de thèses :
    + activity.people dont role = "directeurdethèse"
- date de débat : activity.startDate
- date de soutenance : activity.endDate
- financement : OUPSI ? 
-
- 



# Projet: donnée du prochain contrat






# à corriger/compléter

## ajouter le panel disciplinaire : "Tags HCERES 2017"

## vérifier les grades

## compléter dates de naissance

## compléter les ORCID 