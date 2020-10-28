# Note: this only supports the NextJS web server, not the Netlify lambdas
FROM node:12.16.3

COPY . /app
WORKDIR /app

RUN npm install

RUN npm run build:next

EXPOSE 3000

# Run container as non-root (unprivileged) user
USER node

ENTRYPOINT ["sh", "docker/start.sh"]