# Centrifuge JavaScript Client

CentrifugeJS provides a JavaScript client to interact with the Centrifuge/Altair chains. It provides comprehensive modules to easily create and manage pools, nfts, loans and metadata. CentrifugeJS is built on top of [@polkadot/api](https://polkadot.js.org/docs/api) and uses the [RxJS](https://rxjs.dev/api) API to query chaindata nd submit extrinsics.

## Installation

To use CentrifugeJS its recommended to install rxjs as well.

```bash
npm install --save @centrifuge/centrifuge-js rxjs
```

## Usage

Create an instance and pass optional URLs/websockets URL to connect.

```js
import Centrifuge from '@centrifuge/centrifuge-js'
import { lastValueFrom } from 'rxjs'

const centrifuge = new Centrifuge({
  centrifugeWsUrl: 'wss://fullnode.development.cntrfg.com',
})

// example query
const pools = await lastValueFrom(centrifuge.pools.getPools())

// example extrinsic
const connectedCent = centrifuge.connect(address, signer)
const mintNft = () => {
  return connectedCent.nfts.mintNft([<collection-id>, <nft-id>, <owner>, <metadata>, <amount>])
}

```

The following config can be passed on initilization of CentrifugeJS:

| options                 | default value                                           | description                                                                                                                                         |
| :---------------------- | :------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| `network `              | centrifuge                                              | network the instance should run on                                                                                                                  |
| `centrifugeWsUrl`       | wss://fullnode.centrifuge.io                            | collator websocket URL                                                                                                                              |
| `altairWsUrl`           | wss://fullnode.altair.centrifuge.io                     | altair collator websocket URL                                                                                                                       |
| `polkadotWsUrl`         | wss://rpc.polkadot.io                                   | relay websocket URL                                                                                                                                 |
| `kusamaWsUrl`           | wss://kusama-rpc.polkadot.io                            | kusama relay websocket URL                                                                                                                          |
| `centrifugeSubqueryUrl` | https://api.subquery.network/sq/centrifuge/pools        | indexed subquery URL                                                                                                                                |
| `altairSubqueryUrl`     | https://api.subquery.network/sq/centrifuge/pools-altair | kusama relay websocket URL                                                                                                                          |
| `metadataHost`          | https://altair.mypinata.cloud                           | IPFS gateway url for retrieving metadata                                                                                                            |
| `signer`                |                                                         | Must be set to sign and submit extrinsics                                                                                                           |
| `signingAddress`        |                                                         | Must be set to sign and submit extrinsics                                                                                                           |
| `pinFile`               |                                                         | Must return a `{ uri: string }` containing the URI of the pinned file. This is used to upload and reference metadata in pools, collections and nfts |

## Development

Install dependencies with `yarn` or `npm`.

### Running tests

Run test with `yarn test`

### Building for production

Create a bundle in the `./dist` folder with `yarn build`.

### Publishing to NPM package registry

Make sure the version in `package.json` has been increased since the last publish, then push a tag starting with `centrifuge-js/v*` to kick of the publish Github action.
