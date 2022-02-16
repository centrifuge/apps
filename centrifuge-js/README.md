Centrifuge JavaScript Client
====================

## Installation

```bash
npm install --save @centrifuge/centrifuge-js
```

## Usage

```js
import Centrifuge from '@centrifuge/centrifuge-js'

const centrifuge = new Centrifuge()

// example query
const collections = await centrifuge.nfts.getCollections()
```

## Development

Install dependencies with `yarn`.

## Type generation

The chain metadata of the `dev` environment are stored in `./centrifuge-dev.json`

### Primary commands
- `yarn types:generate:dev`: generates the `@polkadot/api` types using the currently available `./centrifuge-dev.json`
- `yarn types:update:dev`: updates `./centrifuge-dev.json` and then 

### Other commands
- `yarn types:fetch:dev`: fetches the chain metadata from the `dev` environment and updates `./centrifuge-dev.json`
- `yarn types:generate:defs:dev`: generates the `@polkadot/api` types from `interfaces/definitions.ts`
- `yarn types:generate:meta:dev`: generates the `@polkadot/api` types using the chain metadata file `./centrifuge-dev.json`

### Running tests

Run test with `yarn test`

### Building for production

Create a bundle in the `./dist` folder with `yarn build`.
