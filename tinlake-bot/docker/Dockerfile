FROM node:14.15.1

ENV NODE_ENV=production

WORKDIR /app

COPY *.yml *.json yarn.lock ./
COPY .yarn/plugins ./.yarn/plugins/
COPY .yarn/releases ./.yarn/releases/
COPY tinlake-bot ./tinlake-bot/
COPY tinlake.js ./tinlake.js/

RUN yarn set version berry
RUN yarn install

RUN yarn workspace @centrifuge/tinlake-bot build

EXPOSE 3300

CMD ["yarn", "workspace", "@centrifuge/tinlake-bot", "start:prod"]