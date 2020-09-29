FROM node:10.13.0

WORKDIR /usr/src/app

COPY . ./

# https://github.com/npm/npm/issues/18163
RUN npm config set unsafe-perm true

RUN npm install -g yarn
RUN yarn install --pure-lockfile
RUN yarn build:series

EXPOSE 3001

CMD ["yarn", "run", "start:prod"]
