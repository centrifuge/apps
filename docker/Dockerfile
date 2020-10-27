FROM buildkite/puppeteer:latest

COPY ./package.json /package.json
COPY ./package-lock.json /package-lock.json

RUN npm install

COPY ./.env /.env
COPY ./cucumber.js /cucumber.js
COPY ./features/ /features/

RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
  && mkdir -p /home/pptruser/Downloads /app \
  && chown -R pptruser:pptruser /home/pptruser \
  && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

CMD ["npm", "run", "test"]
