#! /usr/bin/env bash
echo -e $TINLAKE_ADDRESSES
echo -e $TINLAKE_ADDRESSES > services/tinlake/addresses_tinlake.json
npm run export
