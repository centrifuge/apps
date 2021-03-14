FROM node:14.15.4-alpine3.10

RUN apk add libsecret-dev git curl make g++

RUN git clone https://github.com/centrifuge/tinlake-subgraph.git

# make the build args available as env vars
ARG NETWORK_NAME
ENV NETWORK_NAME $NETWORK_NAME
ARG GIT_COMMIT_TINLAKE_SUBGRAPH
ENV GIT_COMMIT_TINLAKE_SUBGRAPH $GIT_COMMIT_TINLAKE_SUBGRAPH

WORKDIR tinlake-subgraph

RUN git fetch --all
RUN git checkout $GIT_COMMIT_TINLAKE_SUBGRAPH

RUN npm i

# this silences a few errors related to deploying without an accesstoken
RUN npm install keytar

COPY subgraph-local.yaml .

RUN cat subgraph-local.yaml | envsubst > subgraph.yaml

RUN ./node_modules/.bin/graph codegen ./subgraph.yaml

RUN ./node_modules/.bin/graph build ./subgraph.yaml

# files for pinning the pools metadata to ipfs
COPY pinToIpfs.js .
COPY pools-metadata.json .

COPY deploy.sh .