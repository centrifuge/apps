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
#ENV NIX_PROFILES="/nix/var/nix/profiles/default /home/app//.nix-profile"
#ENV NIX_SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt"

RUN nix-env -f https://github.com/dapphub/dapptools/archive/master.tar.gz -iA solc-static-versions.solc_0_5_15

# install dapp tools
RUN curl https://dapp.tools/install | sh

WORKDIR /app

RUN git clone https://github.com/dapphub/ds-token.git

RUN mkdir keystore

COPY keyfile.json ./keystore

COPY password .

WORKDIR /app/ds-token

RUN dapp update

RUN dapp build

ARG ETH_FROM 
ENV ETH_FROM $ETH_FROM
ARG ETH_GAS
ENV ETH_GAS $ETH_GAS

COPY deploy.sh .


