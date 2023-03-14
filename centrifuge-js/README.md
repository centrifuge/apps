# Centrifuge JavaScript Client

CentrifugeJS provides a JavaScript client to interact with the Centrifuge/Altair chains. It provides comprehensive modules to easily create and manage pools, nfts, loans and metadata. CentrifugeJS is built on top of [@polkadot/api](https://polkadot.js.org/docs/api) and uses the [RxJS](https://rxjs.dev/api) API to query chaindata and submit extrinsics.

## Installation

```bash
npm install --save @centrifuge/centrifuge-js
```

## Init and config

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

## Library structure

Creating a `centrifuge` instance will give you access to the entire polkadot API and subset of modules to make easier to query and write data. We recommend using Typescript for autocompletion.

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

## Queries

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

## `cent.pools.createPool([...args], options): Observable<ISubmittableResult>`

Creating a pool requires a series of extrinsics to be executed sequentially. Using the `cent.pools.createPool()` abstraction provides three ways of creating pools:

1. No restrictions, pools is ready and available after tx is confirmed. Usually used in dev environments.
2. Pool requires democracy but can be fast-tracked (noting the preimage). Usually used in staging environments, e.g Altair.
3. Pool requires democracy and must go through the regular voting process (pool proposal). Offical POP (pool onboarding process).

The method also uploads metadata using the `pinFile()` method should be defined when creating the `centrifuge` instance.

### `createPool()` args

#### `address: string`

The wallet address creating the pool.

#### `pool-id: string`

A new unique pool ID. An available ID can be queried using `cent.pools.getAvailablePoolId()`.

#### `collection-id: string`

A new unique NFT collection ID (for assets). An available ID can be queried using `centrifuge.nfts.getAvailableCollectionId()`

#### `tranches: { interestRatePerSecond: Rate; minRiskBuffer: Perquintill }[]`

An array of tranches to be associated with the pool. The only data the pool is concerned about is `interestRatePerSec` (Rate) and `minRiskBuffer` (Perquintill) for all tranches that are not residual (the most junior tranche). For the most junior tranche an empty object is expected.

Example:

```typescript
  const tranches = [
    {}, // most junior tranche (residual tranche)
    {
      interestRatePerSec: Rate.fromAprPercent("2"),
      minRiskBuffer: Perquintill.fromPercent("20"),
    },
    // ...
  ]
```

#### `max-reserve: CurrencyBalance`

The pools initial maximum reserve (can be changed later).

#### `metadataValues: PoolMetadataInput`

An object containing all of the required keys from the `PoolMetadataInput` type. Note that any images associated with the pool metadata must be uploaded prior to calling the `createPoolMethod`

### `createPool()` options

Along with the regular tx options the `createPool()` supports an additional option: `createType`. This refers to the three different ways to create pools.

| createType     | Description                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `immediate`    | Sign the tx, no further actions required                                                                                             |
| `notePreimage` | Signing the tx will create a fast tracked democracy proposal. Voting will be required. Pool must be initiliazed after voting period. |
| `propose`      | Signing the tx will create a regular democracy proposal. Voting will be required. Pool must be initiliazed after voting period.      |

## Minting assets on Centrifuge Chain

Like creating pools, minting assets also requires a series of transactions to be executed sequentially.

> This guide does not cover authentication (yet), but it is required to make any request to the POD.

The following steps must be executed in order to mint an asset on-chain:

1. `cent.pod.createDocument`: Create a document containing private and public data on the POD. The POD will handle pinning the public metadata to IPFS internally
2. `cent.pod.commitDocumentAndMintNft`: Commit the document to the POD. This will automatically make a request on chain to mint the collateral NFT and will add it to the supplied collection.
3. `cent.pools.createLoan` Create the loan (asset) from the collateral NFT on-chain. This is a transaction/extrinsic on chain and will therefore require a signature.

## `centrifuge.pod.createDocument([...args], options): { documentId: string }`

First, create a document on the POD. This should include public and private asset data. The private data will be stored and encrypted in the POD. Public data will be pinned to IPFS. This tx does not require a signature, the POD will sign for it. Upon completion the request will return the newly created document ID which will be needed in the following steps.

### `createDocument` args

#### `podUrl: string`

The endpoint to reach the POD at.

#### `signedToken: string`

TBD

#### `document: CommitDocumentInput`

TBD

## `centrifuge.pod.commitDocumentAndMintNft([...args], options): { nftId: string; jobId: string}`

After the document is created (and `documentId` is known) it needs to be commited to the chain to prevent changes in the future. The POD will take care of creating the NFT on-chain using the attributes from the provided `documentId`. `commitDocumentAndMintNft()` is doing a lot behind the scenes. So instead of completing immediately, a `jobId` will be returned which can be used to track the progress of function call.

CentrifugeJS provides an async method to wait for the job to finish, which can be found under: `cent.pod.awaitJob()`.

### `commitDocumentAndMintNft` args

#### `podUrl: string`

The endpoint to reach the POD at.

#### `signedToken: string`

TBD

#### `document: CommitDocumentInput`\

TBD

## `cent.pools.createLoan([...args], options): Observable<ISubmittableResult>`

To assign the newly created asset to a pool the job must be completed first. Make sure to use a connected instance of CentrifugeJS to that the transaction can be signed.

### `createLoan` args

#### `poolId: string`

The poolId to which the assets belongs.

#### `collectionId: string`

The id used for the collateral collection.

#### `nftId: string`

The value returned from the `commitDocumentAndMintNft`

## Local development

Install dependencies with `yarn` or `npm`.

Start dev server

```sh
yarn start
```

### Running tests

Run test with `yarn test`

### Building for production

Create a bundle in the `./dist` folder with `yarn build`.

### Publishing to NPM package registry

Make sure the version in `package.json` has been increased since the last publish, then push a tag starting with `centrifuge-js/v*` to kick of the publish Github action.
