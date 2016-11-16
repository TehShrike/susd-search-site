# LIBVIPS
FROM alpine:3.4
RUN apk add --no-cache vips=8.3.3-r0
#FROM mhart/alpine-node
#ADD will.jordan@gmail.com-56bf67f5.rsa.pub /etc/apk/keys/
#RUN apk add --update \
#  --allow-untrusted \
#  --repository https://s3.amazonaws.com/wjordan-apk \
#  vips=8.3.3-r0 \
#  && rm -rf /var/cache/apk/*
#########################################

RUN apk add --no-cache python

RUN mkdir /app
WORKDIR /app

COPY package.json /app
COPY server.js /app

COPY client /app
COPY server /app
COPY public /app

RUN npm install
RUN npm run build

EXPOSE 8888

CMD npm start
