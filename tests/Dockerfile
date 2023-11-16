
FROM ghcr.io/synthetixio/docker-node/ubuntu:18.16

USER root

# disable shared memory X11 affecting Cypress v4 and Chrome
# https://github.com/cypress-io/cypress-docker-images/issues/270
ENV QT_X11_NO_MITSHM=1
ENV _X11_NO_MITSHM=1
ENV _MITSHM=0
# "fake" dbus address to prevent errors
# https://github.com/SeleniumHQ/docker-selenium/issues/87
ENV DBUS_SESSION_BUS_ADDRESS=/dev/null
# point Cypress at the /root/cache no matter what user account is used
# see https://on.cypress.io/caching
ENV CYPRESS_CACHE_FOLDER=/root/.cache/Cypress
# Allow projects to reference globally installed cypress
ENV NODE_PATH=/usr/local/lib/node_modules
# lang setup
ENV LANG_WHICH en
ENV LANG_WHERE US
ENV ENCODING UTF-8
ENV LANGUAGE ${LANG_WHICH}_${LANG_WHERE}.${ENCODING}
ENV LANG ${LANGUAGE}

ENV CI=1

# install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    software-properties-common \
    libgtk2.0-0 \
    libgtk-3-0 \
    libnotify-dev \
    libgconf-2-4 \
    libgbm-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    procps \
    xauth \
    xvfb \
    vim-tiny \
    nano \
    socat \
    supervisor \
    x11-xserver-utils \
    pulseaudio \
    x11vnc \
    fluxbox \
    tzdata \
    language-pack-en \
    # install Chinese fonts
    fonts-arphic-bkai00mp \
    fonts-arphic-bsmi00lp \
    fonts-arphic-gbsn00lp \
    fonts-arphic-gkai00mp \
    fonts-arphic-ukai \
    fonts-arphic-uming \
    ttf-wqy-zenhei \
    ttf-wqy-microhei \
    xfonts-wqy \
    libfontconfig \
    libfreetype6 \
    xfonts-cyrillic \
    xfonts-scalable \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-tlwg-loma-otf \
    fonts-noto-color-emoji \
    # selenium dependencies
    bzip2 \
    ca-certificates \
    openjdk-11-jre-headless \
    jq \
    gnupg2 \
    libcurl4 \
    libcurl3-gnutls \
    libcurl3-nss \
    # Chrome dependencies
    libu2f-udev \
    libvulkan1 \
    libgbm1 \
    fonts-liberation \
    xdg-utils \
    # Cypress dependencies
    zip \
    mplayer \
    ffmpeg \
    imagemagick \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/* \
    && sed -i 's/securerandom\.source=file:\/dev\/random/securerandom\.source=file:\/dev\/urandom/' ./usr/lib/jvm/java-11-openjdk-amd64/conf/security/java.security

# setup timezone
ENV TZ "UTC"
RUN echo "${TZ}" > /etc/timezone \
    && dpkg-reconfigure --frontend noninteractive tzdata

# lang setup
RUN locale-gen ${LANGUAGE} \
    && dpkg-reconfigure --frontend noninteractive locales

COPY display.conf /etc/supervisor/conf.d/
COPY . /app/tests
RUN cd /app/tests && yarn install --frozen-lockfile --network-timeout 1000000 && yarn cache clean


# noVNC setup
ENV NOVNC_SHA="84f102d6a9ffaf3972693d59bad5c6fddb6d7fb0"
ENV WEBSOCKIFY_SHA="c5d365dd1dbfee89881f1c1c02a2ac64838d645f"
RUN wget -nv -O noVNC.zip "https://github.com/novnc/noVNC/archive/${NOVNC_SHA}.zip"
RUN unzip -x noVNC.zip
RUN mv noVNC-${NOVNC_SHA} noVNC
RUN cp /noVNC/vnc.html /noVNC/index.html
RUN rm noVNC.zip
RUN wget -nv -O websockify.zip \
    "https://github.com/novnc/websockify/archive/${WEBSOCKIFY_SHA}.zip"
RUN unzip -x websockify.zip
RUN rm websockify.zip
RUN rm -rf websockify-${WEBSOCKIFY_SHA}/tests
RUN mv websockify-${WEBSOCKIFY_SHA} noVNC/utils/websockify

RUN chmod +x /dev/shm

COPY start-xvfb.sh /usr/bin/

RUN mkdir -p /root/.vnc \
    && x11vnc -storepasswd secret /root/.vnc/passwd

COPY start-vnc.sh \
    start-novnc.sh \
    /usr/bin/

ENV SE_SCREEN_WIDTH 1360
ENV SE_SCREEN_HEIGHT 1020
ENV SE_SCREEN_DEPTH 24
ENV SE_SCREEN_DPI 96
ENV SE_START_XVFB true
ENV START_XVFB true
ENV SE_START_NO_VNC true
ENV SE_NO_VNC_PORT 7900
ENV SE_VNC_PORT 5900
ENV DISPLAY_NUM 99

# Creating base directory for Xvfb
RUN mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

# install Chrome browser
RUN wget -O /usr/src/google-chrome-stable_current_amd64.deb "http://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_113.0.5672.63-1_amd64.deb" && \
    dpkg -i /usr/src/google-chrome-stable_current_amd64.deb ; \
    apt-get install -f -y && \
    rm -f /usr/src/google-chrome-stable_current_amd64.deb

# install Firefox browser
RUN wget --no-verbose -O /tmp/firefox.tar.bz2 https://download-installer.cdn.mozilla.net/pub/firefox/releases/112.0.2/linux-x86_64/en-US/firefox-112.0.2.tar.bz2 \
    && tar -C /opt -xjf /tmp/firefox.tar.bz2 \
    && rm /tmp/firefox.tar.bz2 \
    && ln -fs /opt/firefox/firefox /usr/bin/firefox

# install needed global npm modules
RUN npm install -g @lhci/cli@0.12.0 lighthouse@10.1.1 sitespeed.io@27.3.1 webdriver-manager@12.1.9

# install and setup plugins required by sitespeed.io
WORKDIR /usr/local/lib/node_modules/sitespeed.io/lib/plugins
RUN git clone https://github.com/sitespeedio/plugin-lighthouse.git --depth 1 --branch=main && \
    git clone https://github.com/sitespeedio/plugin-gpsi.git --depth 1 --branch=main
WORKDIR /usr/local/lib/node_modules/sitespeed.io/lib/plugins/plugin-lighthouse
RUN npm install
WORKDIR /usr/local/lib/node_modules/sitespeed.io/lib/plugins/plugin-gpsi
RUN npm install && mv lib/* .
WORKDIR /root

# install selenium drivers (ChromeDriver, GeckoDriver, etc)
RUN npx webdriver-manager update --ignore_ssl --versions.standalone 3.141.59 --versions.chrome 113.0.5672.24 --versions.gecko v0.33.0

# give every user read access to the "/root" folder where the Cypress binary is cached
# we really only need to worry about the top folder, fortunately
RUN ls -la /root
RUN chmod 755 /root

# command "id" should print:
# uid=0(root) gid=0(root) groups=0(root)
# which means the current user is root
RUN id

# Node libraries
RUN node -p process.versions

# print versions of local tools
RUN echo  "node version:  $(node -v) \n" \
    "npm version:           $(npm -v) \n" \
    "yarn version:          $(yarn -v) \n" \
    "Selenium version:      3.141.59 \n" \
    "Chrome version:        $(google-chrome --version || true) \n" \
    "Chromedriver version:  113.0.5672.24 \n" \
    "Firefox version:       $(firefox --version || true) \n" \
    "Geckodriver version:   0.33.0 \n" \
    "git version:           $(git --version) \n" \
    "user:                  $(whoami) \n" \
    "ubuntu version:        $(cat /etc/lsb-release)"

EXPOSE 7900
EXPOSE 5900

CMD ["/usr/bin/supervisord"]
