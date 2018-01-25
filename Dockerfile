FROM node:9.3.0-onbuild
LABEL maintainer="j.innerbichler@gmail.com"

RUN npm install webpack -g
RUN webpack

EXPOSE 3000

ENTRYPOINT ["node", "server.js"]

