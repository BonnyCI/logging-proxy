FROM node:6

MAINTAINER "Jamie Lennox <jamielennox@gmail.com>"

# This started as a copy of node:6:onbuild

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Allow passing NODE_ENV at build time and at run time
ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY package.json /usr/src/app/

RUN npm install && npm cache clean
COPY . /usr/src/app

USER node
EXPOSE 3000

CMD [ "npm", "start" ]
