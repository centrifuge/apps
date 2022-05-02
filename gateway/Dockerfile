FROM node:12.19.0

WORKDIR /usr/src/app

COPY . ./

# https://github.com/npm/npm/issues/18163
RUN npm config set unsafe-perm true

RUN yarn install

# install rsync to copy over build files
RUN apt-get update -y
RUN apt-get install -y rsync

RUN yarn workspace centrifuge-gateway build
RUN yarn workspace centrifuge-gateway move:assets

EXPOSE 3001

CMD ["yarn", "workspace", "centrifuge-gateway", "run", "start:prod"]
