#! /usr/bin/env bash

# Run testnet with dapp testnet
# NOTE: SENIOR_TRANCHE must be set to true in the environmental variables for a senior tranche to be deployed

# superpower user for tinlake.js tests
GOD_ADDRESS=0xf6fa8a3f3199cdd85749ec749fb8f9c2551f9928

# make superpower user from tinlake.js tests to be the governance address (control over the root contract)
# be sure to use the same address in tinlake.js test config
export GOVERNANCE=$GOD_ADDRESS

# build contracts
./tinlake-deploy/bin/util/build_contracts.sh

# setup local config
./bin/test/setup_local_config.sh
source ./bin/test/local_env.sh

#create address folder
mkdir -p ./tinlake-deploy/deployments
mkdir -p ./tinlake-proxy/deployments
mkdir -p ./tinlake-actions/deployments

# deploy tinlake contracts
./tinlake-deploy/bin/deploy.sh

# deploy nft
./tinlake-deploy/bin/test/deploy_collateral_nft.sh

# copy the addresses of deployed contracts from tinlake folder to tinlake.js test folder
mkdir -p ./test
touch ./test/addresses.json
cat ./tinlake-deploy/deployments/addresses_unknown.json > ./test/addresses.json

# rely superpower user on nft collateral contract
NFT_COLLATERAL_ADDRESS=$(cat ./test/addresses.json | jq '.COLLATERAL_NFT' | tr -d '"')
seth send $NFT_COLLATERAL_ADDRESS 'rely(address)' $GOD_ADDRESS

# send funds to superpower user
seth send --value 10000000000000000000000000000000000000000000000000000000 $GOD_ADDRESS

# deploy proxy registry contract
./tinlake-proxy/bin/deploy.sh
cat ./tinlake-proxy/deployments/addresses_unknown.json >> ./test/addresses.json

# deploy tinlake actions
./tinlake-actions/bin/deploy.sh
cat ./tinlake-actions/deployments/addresses_unknown.json >> ./test/addresses.json



