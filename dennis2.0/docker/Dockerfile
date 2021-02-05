FROM node:14.15.1

ENV NODE_ENV=production

WORKDIR /app

COPY *.yml *.json yarn.lock ./
COPY .yarn/plugins ./.yarn/plugins/
COPY .yarn/releases ./.yarn/releases/
COPY dennis2.0 ./dennis2.0/

RUN yarn set version berry
RUN yarn install

RUN yarn workspace @centrifuge/dennis2.0 build

EXPOSE 3300

CMD ["yarn", "workspace", "@centrifuge/dennis2.0", "start:prod"]