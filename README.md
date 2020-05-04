# tinlake-ui

## Development

1. Make sure you are on a stable node version, v12.16.3 on the time of writing this (the `sha3` dependency did not work with newer versions in some cases)
2. Install dependencies with `npm install`

### Setup environment

add the following env variables

- `export NFT_DATA_DEFINITION=PARTNER_NFT_DATA_DEFINITION`
- `export RPC_URL=NETWORK_RPC_URL`
- `export TINLAKE_ADDRESSES=ADDRESSES_FOR_THE_PARTNER_TINLAKE_CONTRACTS`

...or just add a .env file containing the variables to the project folder

### Run

`npm run dev`
