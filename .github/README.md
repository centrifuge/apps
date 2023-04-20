# Monorepo for the Centrifuge applications.

## Setup

Make sure you have installed Yarn and NVM.

1. Use Node v14.15.1: `nvm use`
2. Install dependencies: `yarn install`
3. Install `husky`: `yarn postinstall`
4. Add `.env` files with the right environment variables to each project.

It's also recommended to run Prettier automatically in your editor, e.g. using [this VS Code plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

## Preparing Envs (e.g when the dev chain data is reset)

### Frontend

1. Create pools for initial data

### Faucet

1. Add a valid seed hex to `faucet-api/env-vars/demo.secrets`
2. Fund the account wallet with aUSD and DEVEL/DEMO

### Onboarding API

<!-- TODO: make subdocs pool and tranche specific
1. Add subdocs for new pools and tranches in cloud storage bucket. Format: `centrifuge-onboarding-api-dev/subscription-agreements/<poolId>/<trancheId>.pdf` -->

1. Add a subdoc in cloud storage bucket. Format: `centrifuge-onboarding-api-dev/subscription-agreements/generic_subscription_agreement.pdf`
2. Add the acceptance page in cloud storage bucket. Format: `centrifuge-onboarding-api-dev/acceptance-page.pdf`
3. Add the signature page in cloud storage bucket. Format: `centrifuge-onboarding-api-dev/signature-page.pdf`
4. Onboarding API whitelisting:
   a. Create an account to control the pure proxy and add it’s seed phrase to the secret env variables
   b. Create the pure proxy using the account created in step one
   c. Go to explorer and find the tx that creates the pure proxy, copy the randomly generated address and paste into env variables
   d. Fund both the proxy and the controlling account
   e. In each pool give the pure proxy whitelisting permission - this can only be done by the pool admin

### Asset Originator POD Access

When setting up an Asset Originator for a pool, the account on the POD needs to be manually created

1. Create AO on the Access tab of the Issuers Pool page
2. Copy the address of the newly created AO proxy
3. Get a jw3t auth token. Needs to be signed as Eve on behalf of Eve with proxy type `PodAdmin`. Example token: `ewogImFsZ29yaXRobSI6ICJzcjI1NTE5IiwKICJ0b2tlbl90eXBlIjogIkpXM1QiLAogImFkZHJlc3NfdHlwZSI6ICJzczU4Igp9.ewogImFkZHJlc3MiOiAiNUhHaldBZUZEZkZDV1BzakZRZFZWMk1zdnoyWHRNa3R2Z29jRVpjQ2o2OGtVTWF3IiwKICJpc3N1ZWRfYXQiOiAiMTY4MTk5Mzc4MCIsCiAiZXhwaXJlc19hdCI6ICIxOTk3MzUzNzgwIiwKICJvbl9iZWhhbGZfb2YiOiAiNUhHaldBZUZEZkZDV1BzakZRZFZWMk1zdnoyWHRNa3R2Z29jRVpjQ2o2OGtVTWF3IiwKICJub3RfYmVmb3JlIjogIjE2ODE5OTM3ODAiLAogInByb3h5X3R5cGUiOiAiUG9kQWRtaW4iCn0.-BJ7Y6WurKYwesCMfkTrudsH5ZVseMviVNdZ0kFZmEnAtAYvdxqxN56aVwRR5QvEjK8Of4TVtY_-oPK4hP7Dhg`
4. Call `https://pod.development.cntrfg.com/v2/accounts/generate` (More details about the request here: https://app.swaggerhub.com/apis/centrifuge.io/cent-node/2.1.0#/Accounts/generate_account_v2)
5. Copy `document_signing_public_key`, `p2p_public_signing_key` and `pod_operator_account_id` of the returned result and paste those in the AO section on the Access tab
6. Add hot wallets to the AO
7. The hot wallets should now be able to authenticate with the POD and create assets

## Notes

To add other repositories to this monorepo while preserving the Git history, we can use the following steps: https://medium.com/@filipenevola/how-to-migrate-to-mono-repository-without-losing-any-git-history-7a4d80aa7de2

To set a pool into maintenance mode, add the pool id to the environment variable `NEXT_PUBLIC_FEATURE_FLAG_MAINTENANCE_MODE`.

## Agile release process

To make sure repository admins can control the full workflow of our apps to production safely this repository provides the following flow:

- When you open a PR a new cent-app will be deployed with your PR number on the URL such as: app-prXXX.k-f.dev

- After code is merged to main you can see the changes in: app-dev.k-f.dev

- When a repository admin creates a `centrifuge-app/v*` tag it will will trigger a deployment to [altair.centrifuge.io](https://altair.centrifuge.io). The release needs to FIRST be marked as `prerelease`.

  > Draft releases or tags other than the one above will not trigger any deployments.

- Once ready, you can edit your pre-release and untick the "pre-release" setting to fully publish a release, this will trigger a refresh of our code in app.centrifuge.io and app.ipfs.centrifuge.io (coming soon)

More info on our release process rationale can be found in [our HackMD](https://centrifuge.hackmd.io/MFsnRldyQSa4cadx11OtVg?view) (Private link, only k-f contributors)
