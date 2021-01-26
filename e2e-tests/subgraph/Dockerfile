FROM node:14.15.4-alpine3.10

RUN apk add libsecret-dev git curl make g++

RUN git clone https://github.com/ana0/erc20-subgraph.git

WORKDIR erc20-subgraph

RUN npm i

RUN npm install keytar

RUN npm run codegen

RUN npm run build

COPY deploy.sh .