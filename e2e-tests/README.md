# e2e-tests
End-to-end test suite for Tinlake.

## Setup
1. Use Node v12.18.3: `nvm use`
2. Install dependencies: `yarn install`
3. Add a `.env` file with the right environment variables.

## Usage
Run all tests: `yarn test`

Run a specific feature file: `yarn test -- features/[name].feature`

Run a specific scenario: `yarn test -- --name "[scenario_name]"`

## Usage with docker-compose

The docker-compose file in this project contains a "testing environment in a box" that creates an instance of Parity and of The Graph, and deploys all tinlake contracts and the tinlake subgraph

Most containers use images - the two that do not take care of building the subgraph and the contracts.

The contracts container the deploy scripts from [tinlake-deploy](https://github.com/centrifuge/tinlake-deploy), as well as deploying versions of:
- [Proxy Registry](https://github.com/centrifuge/tinlake-proxy)
- [Pool Registry](https://github.com/centrifuge/tinlake-pools-cli)
- [Tinlake Claim RAD](https://github.com/centrifuge/tinlake-claim-rad)
- [NFT Registry](https://github.com/centrifuge/privacy-enabled-erc721)
- [Tinlake Actions](https://github.com/centrifuge/tinlake-actions)
- [Multicall](https://github.com/makerdao/multical)

And three contracts (Anchor, Identity, and Identity Factory) from [centrifuge ethereum contracts](https://github.com/centrifuge/centrifuge-ethereum-contracts)

The subgraph container deploys the [subgraph](https://github.com/centrifuge/tinlake-subgraph) locally, as well as pinning the [pools metadata](./subgraph/pools-metadata.json) to the ipfs, from where it is consumed by the subgraph and tinlake-ui

First: `cp .env.example .env`

To build: `make build`

To start containers: `make up`

To tear down containers and volumes: `make down`

**Note: it is important to remove volumes between runs in order to 1) ensure contract addresses are the same as in the [subgraph-local.yaml](link) and 2) prevent conflicts in the subgraph name**

To test the dashboard of tinlake-ui, you must also start it locally

First, set the env vars of that subdirectory to point to the local env wherever possible. These ones must be updated:

```
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_TINLAKE_DATA_BACKEND_URL=http://localhost:8000/subgraphs/name/centrifuge/tinlake
NEXT_PUBLIC_IPFS_GATEWAY=http://localhost:8080/ipfs/
NEXT_PUBLIC_POOL_REGISTRY=0xCF396Ff8f2CcF74E88b4dF60AB5dc20902d91553
NEXT_PUBLIC_ONBOARD_API_HOST=http://localhost:3100/
NEXT_PUBLIC_MULTICALL_CONTRACT_ADDRESS=0x122f71f08bfecE230cDa491933C9ac3A5bc41A0A
```

From in tinlake-ui: `yarn start`

From in e2e-tests: `make test`

If the contracts or subgraph are still deploying, `make test` will wait until they have exited before beginning

**Note: `make test` assumes both yarn/node and docker/docker-compose are available to the same user - either root with sudo, or a normal user without**

## Debugging

1. Set `devtools: true` in `features/support/browser-actions.ts`
2. Somewhere in your testing steps/code, add `await debug(this)` (`import { debug } from './utils/debug'`)

### Workaround for Firewall popup showing up on OS X

`sudo codesign --force --deep --sign - ./node_modules/puppeteer/.local-chromium/mac-756035/chrome-mac/Chromium.app`