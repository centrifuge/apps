FROM node:12.16.3

ENV NODE_ENV=production

WORKDIR /app

COPY *.yml *.json yarn.lock ./
COPY .yarn/plugins ./.yarn/plugins/
COPY .yarn/releases ./.yarn/releases/
COPY onboard-api ./onboard-api/

RUN yarn set version berry
RUN yarn install

RUN yarn workspace @centrifuge/onboard-api build

EXPOSE 3100

CMD ["yarn", "workspace", "@centrifuge/onboard-api", "start:prod"]