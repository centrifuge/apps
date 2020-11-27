FROM ubuntu

RUN apt-get update && \
    apt-get -y install curl build-essential automake autoconf git jq

# add user
RUN useradd -d /home/app/ -m -G sudo app
RUN mkdir -m 0755 /app
RUN chown app /app
RUN mkdir -m 0755 /nix
RUN chown app /nix
USER app
ENV USER app

# install nix
RUN curl -L https://nixos.org/nix/install | sh
ENV PATH="/home/app/.nix-profile/bin:${PATH}"
ENV NIX_PATH="/home/app//.nix-defexpr/channels/"
ENV NIX_PROFILES="/nix/var/nix/profiles/default /home/app//.nix-profile"
ENV NIX_SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt"
RUN nix-env -iA dapp hevm seth solc -if https://github.com/dapphub/dapptools/tarball/master --substituters https://dapp.cachix.org --trusted-public-keys dapp.cachix.org-1:9GJt9Ja8IQwR7YW/aF0QvCa6OmjGmsKoZIist0dG+Rs=

# install dapp tools
RUN curl https://dapp.tools/install | sh

# env variables needed by tinlake deployment
ENV ETH_RPC_URL="http://127.0.0.1:8545"
ENV ETH_GAS_PRICE="7000000"
ENV ETH_KEYSTORE="/home/app/.dapp/testnet/8545/keystore"
ENV ETH_PASSWORD="/home/app/.dapp/testnet/8545/.empty-password"
ENV SENIOR_INTEREST_RATE="1000000003593629043335673583"
ENV MAX_RESERVE="100000000000000000000"
ENV MAX_SENIOR_RATIO="850000000000000000000000000"
ENV MIN_SENIOR_RATIO="750000000000000000000000000"
ENV CHALLENGE_TIME="3600"
ENV DISCOUNT_RATE="1000000001585489599188229325"

# copy repository into /app, set rights
WORKDIR /app
USER root
COPY . /app
RUN chown -R app /app && \
    chmod -R 755 /app
USER app

# build contracts and deploy them
RUN nohup bash -c "dapp testnet --save=app &" && \
    curl --connect-timeout 2 --max-time 2 --retry 200 --retry-delay 1 --retry-max-time 120 --retry-connrefused -H "Content-Type: application/json" -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":83}' 127.0.0.1:8545 && \
    ./bin/deploy.sh

RUN mkdir -p /home/app/.dapp/testnet/snapshots && \
    mv /home/app/.dapp/testnet/8545 /home/app/.dapp/testnet/snapshots/app

CMD dapp testnet --load=app
