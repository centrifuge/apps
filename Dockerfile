FROM node:10.13.0

WORKDIR /usr/src/app

COPY . ./

# https://github.com/npm/npm/issues/18163
RUN npm config set unsafe-perm true

RUN npm install

RUN npm run build:series

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
