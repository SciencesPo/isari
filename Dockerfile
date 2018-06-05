FROM node:10.1.0-alpine

RUN apk add --no-cache su-exec

RUN mkdir -p /isari/

COPY . /isari
RUN apk add --no-cache --virtual .gyp \
        python \
        make \
        g++ \
    && cd /isari/scripts && npm --quiet install \
    && cd /isari/server && npm --quiet install --production \
    && npm --force cache clean \
    && apk del .gyp

WORKDIR /isari/server/

EXPOSE 8080

ENV NODE_ENV production

CMD ["su-exec", "node:node", "/usr/local/bin/node", "server.js"] 
