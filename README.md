# Tinlake JavaScript Client

## Usage

Documentation can be found in `./docs/` or at https://centrifuge.github.io/tinlake.js/.

## Development

Install dependencies with `npm install`.

## Running tests
### Pre Installed
- DappTools (https://dapp.tools/)
- jq

#### Run a local Ethereum Node

`dapp testnet --accounts=2`

##### Additional Flags
`--save=name` after finishing, save snapshot
`--load=name` start from a previously saved snapshot

#### Deploy Tinlake Contracts for Tests
`./bin/deploy.sh`

#### Run integration tests
`npm run test`

## Building for production

Create a bundle in the `./dist` folder with `npm run build`.

## Creating documentation

We use [TypeDoc](https://github.com/TypeStrong/typedoc) for documentation. Run `npm run generate-docs` to recreate the `./docs/` folder.
Checkout [TSDoc](https://github.com/microsoft/tsdoc) for formatting guidelines.
