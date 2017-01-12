FROM nginx

ENV SERVER_PORT=8080

ENV SERVER_HOST=server

RUN rm /etc/nginx/conf.d/default.conf

COPY docker-nginx.conf /etc/nginx/conf.d/docker.template

CMD /bin/bash -c "envsubst < /etc/nginx/conf.d/docker.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'" 

