FROM node:10.13.0

WORKDIR /usr/src/app

COPY . .

RUN npm install

EXPOSE 3001

CMD ["npm", "start"]