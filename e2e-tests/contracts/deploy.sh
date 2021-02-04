#!/bin/bash
set -e

mv tinlake-proxy ProxyRegistry
mv tinlake-pools-cli PoolRegistry
mv tinlake-claim-rad TinlakeClaimRAD

export DAPP_SOLC_VERSION=0.5.15

# deploy dependencies not included in tinlake-deploy 
for d in ProxyRegistry PoolRegistry TinlakeClaimRAD; do
    echo "Deploying $d ..."
    cd $d
    git submodule update --init --recursive
    dapp build
    ADDRESS=$(dapp create "$d")
    echo "$d : $ADDRESS"
    cd ..
done

cd /app/tinlake-deploy

# deploy contents of tinlake-deploy using test scripts
git submodule update --init --recursive
make build
make test-config
make deploy