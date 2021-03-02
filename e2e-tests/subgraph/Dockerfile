FROM node:14.15.4-alpine3.10

RUN apk add libsecret-dev git curl make g++

RUN git clone --branch compile-errors https://github.com/ana0/tinlake-subgraph.git

WORKDIR tinlake-subgraph

RUN npm i

# this silences a few errors related to deploying without an accesstoken
RUN npm install keytar

COPY subgraph-local.yaml .

# make the build args available as env vars
ARG NETWORK_NAME
ENV NETWORK_NAME $NETWORK_NAME

RUN cat subgraph-local.yaml | envsubst > subgraph.yaml

RUN ./node_modules/.bin/graph codegen ./subgraph.yaml

RUN ./node_modules/.bin/graph build ./subgraph.yaml

# files for pinning the pools metadata to ipfs
COPY pinToIpfs.js .
COPY pools-metadata.js .

COPY deploy.sh .