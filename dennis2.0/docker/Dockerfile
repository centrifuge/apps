FROM node:15.5.0-buster-slim

#RUN apt-get -y update && apt-get -y upgrade && apt-get install vim curl apt-transport-https ca-certificates gnupg git \
#  build-essential software-properties-common -y

#RUN echo "deb http://ppa.launchpad.net/ethereum/ethereum/ubuntu bionic main" > etc/apt/sources.list.d/ethereum-bioinc.list && \
#    echo "deb-src http://ppa.launchpad.net/ethereum/ethereum/ubuntu bionic main" >>  etc/apt/sources.list.d/ethereum-bioinc.list
#RUN apt-key adv --keyserver keyserver.ubuntu.com  --recv-keys 2A518C819BE37D2C2031944D1C52189C923F6CA9
#RUN apt-get -y update && apt-get install ethereum -y
#
#RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
#RUN apt-get install -y nodejs yarn

RUN npm install -g typescript

COPY . .

RUN yarn && yarn build


