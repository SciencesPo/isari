FROM nginx:1.13-alpine

ENV SERVER_PORT=8080

ENV SERVER_HOST=server

RUN mkdir -p /isari/client

ADD . /isari/client

RUN apk add --no-cache nodejs \
    && cd /isari/client \
    && npm install -g npm@latest \ 
    && npm --quiet install \
    && npm run build  \
    && npm cache clean --force \
    && apk del nodejs \
    && rm -fr /isari/client/node_modules \
    && rm -fr /usr/lib/node_modules /root/.config /root/.npm 

RUN rm /etc/nginx/conf.d/default.conf

COPY docker-nginx.conf /etc/nginx/conf.d/docker.template

CMD /bin/sh -c "envsubst < /etc/nginx/conf.d/docker.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'" 

