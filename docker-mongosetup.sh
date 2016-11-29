#!/bin/bash
mongo --host db:27017 <<EOF
cfg = { "_id" : "rs2es", "version" : 1, "members" : [ { "_id" : 0, "host" : "db:27017" } ] }
rs.initiate(cfg)
EOF
