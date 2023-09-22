# Centrifuge App

## Data and UI Architecture

UI

- `centrifuge-js`: library to interact with the Centrifuge chain and subquery
- `fabric`: design system elements and components
- `centrifuge-react`: reusable React component and hooks (wallets, queries, transactions)

Cloud functions

- `onboarding-api`: KYC/KYB and investor whitelisting
- `faucet-api`: dev chain faucet
- `pinning-api`: pin documents to Pinata (IPFS)

Indexing

- [pools-subql](https://github.com/centrifuge/pools-subql): subquery to index pools and assets

## Development

### Prerequisites

- node v16
- yarn

### Setup

1. copy [.env.development](./.env-config/env.development) to `.env.development.local`
2. Install modules:
   ```bash
   $ yarn
   ```
3. Start the development server:
   ```bash
   $ yarn start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Other useful information

This app uses [`vite`](https://vitejs.dev/guide/) to serve, build and bundle.

To reference env variables in code please use the viste standard `import.meta.env.ENV_VARIABLE`.

## Deployments

Up-to-date info in k-f's Knowledge Base:

https://centrifuge.hackmd.io/MFsnRldyQSa4cadx11OtVg?view#Environments-amp-Deployments
