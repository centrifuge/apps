# Centrifuge JavaScript Client

CentrifugeJS provides a JavaScript client to interact with the Centrifuge/Altair chains. It provides comprehensive modules to easily create and manage pools, nfts, loans and metadata. CentrifugeJS is built on top of [@polkadot/api](https://polkadot.js.org/docs/api) and uses the [RxJS](https://rxjs.dev/api) API to query chaindata and submit extrinsics.

## Installation

```bash
npm install --save @centrifuge/centrifuge-js
```

## Usage

Create an instance and pass optional configuration

```js
import Centrifuge from '@centrifuge/centrifuge-js'

const centrifuge = new Centrifuge({
  centrifugeWsUrl: 'wss://fullnode.development.cntrfg.com',
})
```

The following config options can be passed on initilization of CentrifugeJS:

#### `network`

Default value: `centrifuge`

Network the instance should run on, either `altair` or `centrifuge`.

#### `centrifugeWsUrl`

Default value: `wss://fullnode.centrifuge.io`

Collator websocket URL.

#### `altairWsUrl`

Default value: `https://api.subquery.network/sq/centrifuge/pools`

Altair collator websocket URL.

#### `metadataHost`

Default value: `https://altair.mypinata.cloud`

IPFS gateway url for retrieving metadata.

#### `centrifugeSubqueryUrl`

Default value: `https://api.subquery.network/sq/centrifuge/pools`

Indexed subquery for retrieving historical chain data.

#### `signer`

Can either be passed in the config on initialization or can be set programmatically by calling `centrifuge.connect(<signing-address>, <signer>)`

#### `signingAddress`

Can either be passed in the config on initialization or can be set programmatically by calling `centrifuge.connect(<signing-address>, <signer>)`

#### `pinFile`

A function that returns an object `{ uri: string }` containing the URI of the pinned file. This is used to upload and reference metadata in pools, collections and nfts. If not set, `pools.createPool`, `nfts.mintNft` etc will not work.

## How to use

Creating a `centrifuge` instance will give you access to the entire polkadot API and subset of modules to make easier to query and write data.

The modules include:

- `pools`
- `nfts`
- `metadata`
- and a few more..

Methods are accessed like this:

```js
// pools
const data = centrifuge.pools.createPool([...])

// nfts
const data = centrifuge.nfts.mintNft([...])

// metadata
const data = centrifuge.metadata.getMetadata("uri")
```

## Centrifuge queries

All of the CentrifugeJS modules have queries prefixed with `get` that return [Observables](https://rxjs.dev/guide/observable).

Here's a full sample how to query all of the pools and subscribe to the state. Behind the scenes the pool data is aggregated from multiple sources and formatted into an object. By subscribing to the observable you're also subscribing to events on-chain that will cause the subscription to update when necessary.

```js
centrifuge.pools.getPools().subscribe({
  next: (value) => {
    console.log('next', value) // Pool[]
  },
  complete: () => {
    console.log('complete')
  },
  error: () => {
    console.log('error')
  },
})
```

Some cases don't require a subscription. We find it easist to use a helper from `rxjs` to convert the observable into a promise. You'll have to install `rxjs`

```sh
yarn add --save rxjs
```

Then the query could look like this

```js
import { firstValueFrom } from 'rxjs'

// ...

const pools = await firstValueFrom(cenrtifuge.pools.getPools()) // Pool[]
```

## Transactions

Transactions/extrinsics require a little more configuration because they need to be signed. Please note that this does not cover how to sign transactions with a proxy.

By connecting the `centrifuge` instance with a `signer`, the sourced wallet extension will be triggered to ask for a signature. The `signer` can be any signer that's compatible with the polkadot API. We use [@subwallet/wallet-connect](https://openbase.com/js/@subwallet/wallet-connect) to source mutliple wallets.

```js
// wallet setup imported from @subwallet/wallet-connect/dotsama/wallets
const wallet = getWalletBySource("polkadot-js");
await wallet?.enable();
const accounts = await wallet?.getAccounts();

const signingAddress = accounts?.[0].address as string;

// connect centrifuge to wallet to enable signatures
const connectedCent = centrifuge.connect(signingAddress, wallet?.signer);

// subscription based
connectedCent.pools.closeEpoch(["<your-pool-id>"]).subscribe({
  complete: () => {
    console.log("Tx complete");
  }
});

// or promise based (using firstValueFrom imported from rxjs)
await firstValueFrom(connectedCent.pools.closeEpoch(["<your-pool-id>"]))
```

## Development

Install dependencies with `yarn` or `npm`.

### Running tests

Run test with `yarn test`

### Building for production

Create a bundle in the `./dist` folder with `yarn build`.

### Publishing to NPM package registry

Make sure the version in `package.json` has been increased since the last publish, then push a tag starting with `centrifuge-js/v*` to kick of the publish Github action.
