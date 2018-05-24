FROM node:10.1.0-slim

ENV GOSU_VERSION 1.10
RUN set -x \
	&& apt-get update && apt-get install -y --no-install-recommends ca-certificates wget && rm -rf /var/lib/apt/lists/* \
	&& dpkgArch="$(dpkg --print-architecture | awk -F- '{ print $NF }')" \
	&& wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch" \
	&& wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$dpkgArch.asc" \
	&& export GNUPGHOME="$(mktemp -d)" \
	&& gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4 \
	&& gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu \
	&& rm -r "$GNUPGHOME" /usr/local/bin/gosu.asc \
	&& chmod +x /usr/local/bin/gosu \
	&& gosu nobody true \
	&& apt-get purge -y --auto-remove ca-certificates wget

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

