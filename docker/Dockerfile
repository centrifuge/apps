FROM node:12.18.3-buster-slim@sha256:dd6aa3ed10af4374b88f8a6624aeee7522772bb08e8dd5e917ff729d1d3c3a4f

# To run Headful mode, you will need to have a display, which is not present in a server. 
# To avoid this, we will use Xvfb, and create a fake display, so the chrome will think there is a display and run properly. 
# So we just need to install Xvfb and Puppeteer related dependencies.
RUN apt-get update && apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget x11vnc x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps xvfb libgbm-dev

# I am going to ignore dumb-init or such for now since it will add complexities to understand what is actually needed here. 

# Install git because we need it to pull tinlake-pool-config when running npm install
RUN apk add --no-cache git

# Copy files
COPY package.json /package.json
COPY package-lock.json /package-lock.json

RUN npm install

# optionally copy .env
COPY cucumber.js .env* /
COPY features/ /features/
COPY src/ /src/

# I'll also assume you are going to use root user, 
# and your script has `--no-sandbox` and `--disable-setuid-sandbox` arguments.
# We run a fake display and run our script.
# Start script on Xvfb
CMD xvfb-run --server-args="-screen 0 1024x768x24" npm run test
