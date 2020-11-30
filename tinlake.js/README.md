# Tinlake JavaScript Client

## Usage

Documentation can be found in `./docs/` or at https://centrifuge.github.io/tinlake.js/.

## Development

Install dependencies with `yarn install`.

## Running tests
### Pre Installed
- DappTools (https://dapp.tools/)
- jq

#### Run a local Ethereum Node

`dapp testnet --accounts=2`

##### Additional Flags
`--save=name` after finishing, save snapshot
`--load=name` start from a previously saved snapshot

#### Update dependencies/submodules
`./bin/update.sh`

#### Deploy Tinlake Contracts for Tests
`./bin/deploy.sh`

#### Run integration tests
`yarn test`

## Alternatively, run a docker-based local network with all tinlake contracts deployed

**1. Build the docker image**

```bash
docker build -t centrifugeio/tinlake-in-a-box:latest .
```

**2. To get the contract addresses from the container, run**

```bash
docker run -it --rm centrifugeio/tinlake-in-a-box:latest cat /app/test/addresses.json > ./test/addresses.json
```

**3. Run a docker container**

```bash
docker run --rm -p 8545:8545 centrifugeio/tinlake-in-a-box:latest
```

## Use the docker container to interact with the chain

```bash
docker run -it --rm centrifugeio/tinlake-in-a-box:latest seth help
```


## Building for production

Create a bundle in the `./dist` folder with `npm run build`.

## Creating documentation

We use [TypeDoc](https://github.com/TypeStrong/typedoc) for documentation. Run `npm run generate-docs` to recreate the `./docs/` folder.
Checkout [TSDoc](https://github.com/microsoft/tsdoc) for formatting guidelines.
