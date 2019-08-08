#! /usr/bin/env bash
echo -e $TINLAKE_ADDRESSES
echo -e $TINLAKE_ADDRESSES > services/tinlake/addresses_tinlake.json
echo -e $NFT_DATA_DEFINITION
echo -e $NFT_DATA_DEFINITION > nft_data_definition.json
npm run export
