FROM ubuntu

RUN apt-get update && \
    apt-get -y install curl build-essential automake autoconf git jq

# add user
RUN useradd -d /home/app -m -G sudo app
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

# install dapp tools and solc
RUN nix-env -iA dapp hevm seth solc ethsign -f https://api.github.com/repos/dapphub/dapptools/tarball/dapp/0.28.0
RUN nix-env -iA solc-static-versions.solc_0_5_15 -f https://github.com/dapphub/dapptools/archive/master.tar.gz 

WORKDIR /app

# clone all needed contracts
RUN git clone --branch config-from-env https://github.com/ana0/tinlake-deploy.git
RUN git clone https://github.com/centrifuge/tinlake-proxy
RUN git clone https://github.com/centrifuge/tinlake-pools-cli
RUN git clone https://github.com/centrifuge/tinlake-claim-rad

# add the keys that were pre-funded in parity config
RUN mkdir keystore
COPY dev-keyfile.json ./keystore
COPY dev-password .

COPY deploy.sh .


