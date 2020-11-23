FROM node:12.18.3-buster-slim@sha256:dd6aa3ed10af4374b88f8a6624aeee7522772bb08e8dd5e917ff729d1d3c3a4f

# Install Xvfb, which is a virtual display, used for running Puppeteer in headful mode
RUN apt-get update && apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget x11vnc x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps xvfb libgbm-dev

# Install git because we need it to pull tinlake-pool-config when running npm install
RUN apt-get install -y git

# Copy files
COPY package.json /package.json
COPY yarn.lock /yarn.lock

RUN mkdir /e2e-tests
COPY e2e-tests/package.json /e2e-tests/package.json

# Install npm dependencies
RUN yarn install

# Optionally copy .env
COPY e2e-tests/cucumber.js .env* /e2e-tests/

# Copy source files
COPY e2e-tests/features/ /e2e-tests/features/
COPY e2e-tests/src/ /e2e-tests/src/

RUN mkdir /e2e-tests/screenshots

# Run tests with the xvfb virtual display
WORKDIR /e2e-tests
CMD xvfb-run --server-args="-screen 0 1024x768x24" yarn run test -- --exit --publish