#!/bin/bash

CONFIG_FILE=/isari/server/config/default.toml

: ${SERVER_PORT:=8080}
: ${SESSION_SECRET:="You have to specify your own session key"}
: ${MONGO_HOST:=db}
: ${MONGO_PORT:=27017}
: ${MONGO_DB:=isari}
: ${ES_HOST:=index}
: ${ES_PORT:=9200}
: ${ES_INDEX:=isari}
: ${LDAP_HOST:=ldap.example.com}
: ${LDAP_PORT:=389}
: ${LDAP_BASE_DN:=ou=Users,dc=example,dc=com}
: ${LDAP_ACTIVE_FLAG:=Active}
: ${LDAP_SKIP:=true}


if [[ -n "$SERVER_PORT" ]]; then 
	sed  -E -i '/^\[http\]$/,/^\[/ s/^port\s*=\s*[0-9]*/port = '"$SERVER_PORT"'/' $CONFIG_FILE
fi

if [[ -n "$SESSION_SECRET" ]]; then 
	sed  -E -i '/^\[session\]$/,/^\[/ s/^secret\s*=.*/secret = '"\'$SESSION_SECRET\'"'/' $CONFIG_FILE
fi

if [[ -n "$MONGO_PORT" ]] && [[ -n "$MONGO_DB" ]] && [[ -n "$MONGO_HOST" ]]; then 
	sed  -E -i '/^\[mongo\]$/,/^\[/ s/^url\s*=.*/url = '"\'mongodb:\/\/$MONGO_HOST:$MONGO_PORT\/$MONGO_DB\'"'/' $CONFIG_FILE
fi

if [[ -n "$ES_PORT" ]]  && [[ -n "$ES_HOST" ]]; then 
	sed  -E -i '/^\[elasticsearch\]$/,/^\[/ s/^host\s*=.*/host = '"\'$ES_HOST:$ES_PORT\'"'/' $CONFIG_FILE
fi

if [[ -n "$ES_INDEX" ]]; then 
	sed  -E -i '/^\[elasticsearch\]$/,/^\[/ s/^index\s*=.*/index = '"\'$ES_INDEX\'"'/' $CONFIG_FILE
fi

if [[ -n "$LDAP_HOST" ]] && [[ -n "$LDAP_PORT" ]]; then 
	sed  -E -i '/^\[ldap\]$/,/^\[/ s/^url\s*=.*/url = '"\'ldap:\/\/$LDAP_HOST:$LDAP_PORT\'"'/' $CONFIG_FILE
fi

if [[ -n "$LDAP_BASE_DN" ]]; then 
	sed  -E -i '/^\[ldap\]$/,/^\[/ s/^dn\s*=.*/dn = '"\'$LDAP_BASE_DN\'"'/' $CONFIG_FILE
fi

if [[ -n "$LDAP_ACTIVE_FLAG" ]]; then 
	sed  -E -i '/^\[ldap\]$/,/^\[/ s/^activeFlag\s*=.*/activeFlag = '"\'$LDAP_ACTIVE_FLAG\'"'/' $CONFIG_FILE
fi

if [[ -n "$LDAP_SKIP" ]]; then 
	sed  -E -i '/^\[ldap\]$/,/^\[/ s/^skip\s*=.*/skip = '"$LDAP_SKIP"'/' $CONFIG_FILE
fi

exec su -l node -c "node server" -m -p 
