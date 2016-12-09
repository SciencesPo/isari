# ISARI

ISARI is a web application which helps universities to report research activities.  
This project is licensed under [AGPLv3](LICENSE.md).

## specifications and architecture

One can find more info about [ISARI specifications](specs/README.md).

## dev environnement setup

```bash
#installer docker depuis le site de docker
https://docs.docker.com/engine/installation/linux/

#installer les dépendances python dev
sudo apt-get install python-dev

#installer docker compose
sudo pip install docker-compose

#accéder aux fichiers docker
cd server/dev_docker

#lancer le serveur
sudo docker-compose -p isari up

# vérifier 
sudo docker ps
CONTAINER ID        IMAGE                   COMMAND                  CREATED             STATUS              PORTS                              NAMES
7ad8b7f9f413        totem/docker-mongo-es   "/usr/bin/dumb-init /"   13 minutes ago      Up 13 minutes                                          isari_connector_1
d57466305690        mongo:3.2.9             "/entrypoint.sh mongo"   13 minutes ago      Up 13 minutes       0.0.0.0:27017->27017/tcp           isari_db_1
6bf60c93ddf2        elasticsearch:2.3.5     "/docker-entrypoint.s"   13 minutes ago      Up 13 minutes       0.0.0.0:9200->9200/tcp, 9300/tcp   isari_index_1
```

## fully reinitialize database

```bash
./reset-db /path/to/isari_data
```

## prod environnement setup 

To be defined...





