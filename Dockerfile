FROM node:boron-slim

RUN mkdir -p /isari/client /isari/server /isari/scripts

ADD ./client/package.json /isari/client
ADD ./scripts/package.json /isari/scripts
ADD ./server/package.json /isari/server

RUN cd /isari/client && npm --quiet install 
RUN cd /isari/scripts && npm --quiet install
RUN cd /isari/server && npm --quiet install --production

COPY . /isari

RUN cd /isari/client && npm run build

WORKDIR /isari/server/

EXPOSE 8080

VOLUME /isari/client/dist

ENV NODE_ENV production

ENTRYPOINT [ "/isari/docker-entrypoint.sh" ]

