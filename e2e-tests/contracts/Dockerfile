FROM isthisa/tinlake_contracts:v0.1.2

# clone all needed contracts
RUN git clone https://github.com/centrifuge/tinlake-deploy.git
RUN git clone https://github.com/centrifuge/tinlake-proxy
RUN git clone https://github.com/centrifuge/tinlake-pools-cli
RUN git clone https://github.com/centrifuge/tinlake-claim-rad
RUN git clone https://github.com/centrifuge/privacy-enabled-erc721.git
RUN git clone https://github.com/centrifuge/tinlake-actions.git
RUN git clone https://github.com/centrifuge/centrifuge-ethereum-contracts.git

# add the keys that were pre-funded in parity config
RUN mkdir keystore
COPY dev-keyfile.json ./keystore
COPY dev-password .

# npm install for the contracts using node
WORKDIR /app/centrifuge-ethereum-contracts
RUN npm install
COPY truffle.js .
COPY deployIdentity.js .

WORKDIR /app

COPY deploy.sh .

USER root
# make absolutely sure deploy.sh is executable
RUN chmod +x deploy.sh
USER app