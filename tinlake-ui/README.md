# tinlake-ui

## Development

1. Make sure you are on a stable node version, v12.16.3 on the time of writing this (the `sha3` dependency did not work with newer versions in some cases): `nvm use`
2. Install dependencies with `yarn install`

### Setup environment

add the following env variables

- `export NFT_DATA_DEFINITION=PARTNER_NFT_DATA_DEFINITION`
- `export RPC_URL=NETWORK_RPC_URL`
- `export TINLAKE_ADDRESSES=ADDRESSES_FOR_THE_PARTNER_TINLAKE_CONTRACTS`

...or just add a .env file containing the variables to the project folder

### Run

To build tinlake.js and start the NextJs server and serve the Netlify lambdas locally

```shell
yarn start
```

### Debugging

There are a few flags you can use in your url query string to debug Tinlake:

#### General

`?address=0x..` or `?debug_eth_address=0x..` allows you to view the state of the UI for any Ethereum address

#### Dashboard/Pool list

`?showAll=true` allows you to view additional metrics for pools
`?showArchived=true` allows you to view archived pools

#### Rewards

`?debug=true` allows you to get additional data on the rewards for the connected user
