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


## JIT

### Building

```
-rw-rw-r-- 1 t8g t8g  23K janv. 24 18:01 dist/main.128c29937159af83fd92.bundle.js.gz
-rw-rw-r-- 1 t8g t8g 9,1K janv. 24 18:01 dist/styles.f6bf9802b72ce139a43f.bundle.js.gz
-rw-rw-r-- 1 t8g t8g 304K janv. 24 18:01 dist/vendor.8cca11f42c89e729bf23.bundle.js.gz
```

### Draw

* People : 4.83s
* Login : 2.97s

## AOT

### Building

```
-rw-rw-r-- 1 t8g t8g 105K janv. 24 18:04 dist/main.79fc0fa9aa5c0f062a85.bundle.js.gz
-rw-rw-r-- 1 t8g t8g 9,1K janv. 24 18:04 dist/styles.4702ec2bf564b2eb5648.bundle.js.gz
-rw-rw-r-- 1 t8g t8g 211K janv. 24 18:04 dist/vendor.a4881032dda088f78d32.bundle.js.gz
```

## Draw

* People : 3.6s
* Login : 1.05s





