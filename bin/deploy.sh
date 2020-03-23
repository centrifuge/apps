# run testnet
# dapp testnet

# remove submodules and install newest dependencies
[ -d ./tinlake ] && rm -r ./tinlake
[ -d ./tinlake-proxy ] && rm -rf ./tinlake-proxy
[ -d ./tinlake-actions ] && rm -rf ./tinlake-actions
git submodule update --init --recursive 
git submodule update --recursive --remote --merge 

# superpower user for tinlake.js tests
GOD_ADDRESS=0xf6fa8a3f3199cdd85749ec749fb8f9c2551f9928

# make superpower user from tinlake.js tests to be the governance address (control over the root contract)
# be sure to use the same address in tinlake.js test config
export GOVERNANCE=$GOD_ADDRESS

# setup local config
./tinlake/bin/test/setup_local_config.sh

# src env for contract deployment
source ./tinlake/bin/util/util.sh
source ./tinlake/bin/test/local_env.sh

#create address folder
mkdir ./tinlake/deployments
mkdir ./tinlake-proxy/deployments
mkdir ./tinlake-actions/deployments

# deploy tinlake contracts
./tinlake/bin/deploy.sh

# deploy nft
./tinlake/bin/test/deploy_collateral_nft.sh

# copy the addresses of deployed contracts from tinlake folder to tinlake.js test folder
touch ./test/addresses.json
cat ./tinlake/deployments/addresses_unknown.json > ./test/addresses.json

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



