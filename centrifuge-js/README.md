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

### Running tests

Run test with `yarn test`

### Building for production

Create a bundle in the `./dist` folder with `yarn build`.
