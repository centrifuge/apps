#! /usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
BIN_DIR=${BIN_DIR:-$(cd "${0%/*}"&&pwd)}
cd $BIN_DIR
CONTRACT_BIN=$BIN_DIR/../../tinlake-deploy/lib/tinlake/out

source $BIN_DIR/../../tinlake-deploy/bin/util/util.sh

# set SETH enviroment variable
source $BIN_DIR/local_env.sh

# Defaults
test -z "$CURRENCY_SYMBOL" && CURRENCY_SYMBOL="DAI"
test -z "$CURRENCY_NAME" && CURRENCY_NAME="DAI Stablecoin"
test -z "$CURRENCY_VERSION" && CURRENCY_VERSION="a"
test -z "$CURRENCY_CHAINID" && CURRENCY_CHAINID=1

# Deploy Default Currency
message create ERC20 Tinlake currency
TINLAKE_CURRENCY=$(seth send --create $CONTRACT_BIN/SimpleToken.bin 'SimpleToken(string memory,string memory,string memory, uint)' "$CURRENCY_SYMBOL" "$CURRENCY_NAME" "$CURRENCY_VERSION" $(seth --to-uint256 $CURRENCY_CHAINID))

message create Main Deployer
MAIN_DEPLOYER=$(seth send --create $CONTRACT_BIN/../../../out/MainDeployer.bin 'MainDeployer()')

CONFIG_FILE=$1
[ -z "$1" ] && CONFIG_FILE="$BIN_DIR/../../tinlake-deploy/bin/config_$(seth chain).json"

touch $CONFIG_FILE


addValuesToFile $CONFIG_FILE <<EOF
{
    "ETH_RPC_URL" :"$ETH_RPC_URL",
    "ETH_FROM" :"$ETH_FROM",
    "ETH_GAS" :"$ETH_GAS",
    "ETH_KEYSTORE" :"$ETH_KEYSTORE",
    "ETH_PASSWORD" :"$ETH_PASSWORD",
    "TINLAKE_CURRENCY": "$TINLAKE_CURRENCY",
    "MAIN_DEPLOYER": "$MAIN_DEPLOYER"
}
EOF
message config file created
cat $CONFIG_FILE
message Path: $(realpath $CONFIG_FILE)
