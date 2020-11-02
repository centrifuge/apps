FROM node:12.18.3-buster-slim@sha256:dd6aa3ed10af4374b88f8a6624aeee7522772bb08e8dd5e917ff729d1d3c3a4f

# Install Xvfb, which is a virtual display, used for running Puppeteer in headful mode
RUN apt-get update && apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget x11vnc x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps xvfb libgbm-dev

# Install git because we need it to pull tinlake-pool-config when running npm install
RUN apt-get install -y git

# Copy files
COPY package.json /package.json
COPY package-lock.json /package-lock.json

# Install npm dependencies
RUN npm install

# Optionally copy .env
COPY cucumber.js .env* /
COPY features/ /features/
COPY src/ /src/
COPY docker/start.sh /start.sh

RUN mkdir /screenshots

# Run tests with the xvfb virtual display
CMD xvfb-run --server-args="-screen 0 1024x768x24" npm run test
# ENTRYPOINT ["sh", "start.sh"]