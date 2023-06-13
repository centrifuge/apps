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

Setup pure proxy to sign transactions.

1. Wallet A calls proxy.create_pure(..) . This creates a pure proxy, which doesn’t have a private key or seed. You can then copy the address (pure_proxy_address) from the event submitted.
2. Wallet A calls proxy.proxy(pure_proxy_address, proxy.add_proxy(secure_wallet_B, type=PermissionManagement)
3. Wallet A calls proxy.proxy(pure_proxy_address, proxy.add_proxy(multisig_C, type=Any). Multisig C is some multisig that can swap out wallet B if it ever gets compromised / lost. This should be at least a multisig with 2 signer threshold.
4. Add the pure_proxy_address to the env variable `MEMBERLIST_ADMIN_PURE_PROXY` in the onboarding api and `REACT_APP_MEMBERLIST_ADMIN_PURE_PROXY` in the centrifuge-app env variables.

Note: onboarding must be manually enabled for each tranche in the issuer settings.

### Asset Originator POD Access

When setting up an Asset Originator for a pool, the account on the POD needs to be manually created

1. Create AO on the Access tab of the Issuers Pool page
2. Copy the address of the newly created AO proxy
3. Get a jw3t auth token. Needs to be signed as Eve on behalf of Eve with proxy type `PodAdmin`. Example token: `ewogImFsZ29yaXRobSI6ICJzcjI1NTE5IiwKICJ0b2tlbl90eXBlIjogIkpXM1QiLAogImFkZHJlc3NfdHlwZSI6ICJzczU4Igp9.ewogImFkZHJlc3MiOiAiNUhHaldBZUZEZkZDV1BzakZRZFZWMk1zdnoyWHRNa3R2Z29jRVpjQ2o2OGtVTWF3IiwKICJpc3N1ZWRfYXQiOiAiMTY4MTk5Mzc4MCIsCiAiZXhwaXJlc19hdCI6ICIxOTk3MzUzNzgwIiwKICJvbl9iZWhhbGZfb2YiOiAiNUhHaldBZUZEZkZDV1BzakZRZFZWMk1zdnoyWHRNa3R2Z29jRVpjQ2o2OGtVTWF3IiwKICJub3RfYmVmb3JlIjogIjE2ODE5OTM3ODAiLAogInByb3h5X3R5cGUiOiAiUG9kQWRtaW4iCn0.-BJ7Y6WurKYwesCMfkTrudsH5ZVseMviVNdZ0kFZmEnAtAYvdxqxN56aVwRR5QvEjK8Of4TVtY_-oPK4hP7Dhg`

A token can be created with the code below:

```js
const keyring = new Keyring({ type: 'sr25519' })
const EveKeyRing = keyring.addFromUri('//Eve')

const centrifuge = new Centrifuge({
  polkadotWsUrl: 'wss://fullnode-relay.development.cntrfg.com',
  centrifugeWsUrl: 'wss://fullnode.development.cntrfg.com',
  signingAddress: AliceKeyRing,
})

const token = await centrifuge.auth.generateJw3t(EveKeyRing, undefined, {
  onBehalfOf: EveKeyRing.address,
  proxyType: 'PodAdmin',
  expiresAt: String(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10), // 10 years
})
```

`PodAdmin` is a special proxy type that only exists on the POD and not on-chain.

4. Call `https://pod.development.cntrfg.com/v2/accounts/generate` (More details about the request here: https://app.swaggerhub.com/apis/centrifuge.io/cent-node/2.1.0#/Accounts/generate_account_v2) with the token in the Authorization header. Example below:

```bash
curl --request POST \
  --url https://pod.development.cntrfg.com/v2/accounts/generate \
  --header 'Authorization: Bearer ewogImFsZ29yaXRobSI6ICJzcjI1NTE5IiwKICJ0b2tlbl90eXBlIjogIkpXM1QiLAogImFkZHJlc3NfdHlwZSI6ICJzczU4Igp9.ewogImFkZHJlc3MiOiAiNUhHaldBZUZEZkZDV1BzakZRZFZWMk1zdnoyWHRNa3R2Z29jRVpjQ2o2OGtVTWF3IiwKICJpc3N1ZWRfYXQiOiAiMTY4MTIwNjk4NCIsCiAiZXhwaXJlc19hdCI6ICIxNjgzNzk4OTg0IiwKICJvbl9iZWhhbGZfb2YiOiAiNUhHaldBZUZEZkZDV1BzakZRZFZWMk1zdnoyWHRNa3R2Z29jRVpjQ2o2OGtVTWF3IiwKICJub3RfYmVmb3JlIjogIjE2ODEyMDY5ODQiLAogInByb3h5X3R5cGUiOiAiUG9kQWRtaW4iCn0.oLovvmVzXJRz-eY1V0wHFNdF6HnVa1unx684xEoMhgBOdCyV8I4yZvUjMx4qLK1vj9Oeh42dAmJ5_vAti9D4jQ' \
  --header 'Content-Type: application/json' \
  --data '{
  "account": {
    "identity": "0x3fe43572af486a48cf27e038fd42a2657cd8495c5f4f1a5553833135eb75b316",
    "precommit_enabled": true,
    "webhook_url": "https://centrifuge.io"
  }
}'
```

`identity` is the hex formatted address for the account you want to create.
The response will look something like:

```json
{
  "identity": "0x3fe43572af486a48cf27e038fd42a2657cd8495c5f4f1a5553833135eb75b316",
  "webhook_url": "https://centrifuge.io",
  "precommit_enabled": true,
  "document_signing_public_key": "0x85d46bae1577ead77f00931fc63618e2587486d8c95dc7fc8637a63fde0668ed",
  "p2p_public_signing_key": "0xafed109165d041b83f2a42a8863a28277e0fa35e900e9544d0c46e2e2772b488",
  "pod_operator_account_id": "0x1cbd2d43530a44705ad088af313e18f80b53ef16b36177cd4b77b846f2a5f07c"
}
```

5. Copy `document_signing_public_key`, `p2p_public_signing_key` and `pod_operator_account_id` of the returned result and paste those in the AO section on the Access tab
6. Add hot wallets to the AO and submit the form
7. If successful, the hot wallets should now be able to authenticate with the POD and be able to create assets.

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
