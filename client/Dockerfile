
FROM node:10.1.0-alpine AS client

COPY ./specs /isari/specs

COPY ./client /isari/client

RUN  cd /isari/client \
    && npm install -g npm@5.6.0 \ 
    && npm --quiet install \
    && npm run build  

FROM nginx:1.13-alpine

ENV SERVER_PORT=8080

ENV SERVER_HOST=server

COPY --from=client --chown=nginx:nginx /isari/client/dist /isari/client/dist

RUN /bin/rm /etc/nginx/conf.d/default.conf

COPY ./client/docker-nginx.conf /etc/nginx/conf.d/docker.template

COPY ./client/docker-entrypoint.sh /

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]

