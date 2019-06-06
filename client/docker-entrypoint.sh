#!/bin/sh 

export NS=$(cat /etc/resolv.conf |grep nameserver|awk -F" " '{print $2}')

envsubst '\$NS \$SERVER_HOST \$SERVER_PORT' < /etc/nginx/conf.d/docker.template > /etc/nginx/conf.d/default.conf

exec "$@"
