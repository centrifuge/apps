# Monorepo for the Centrifuge applications

## Preparing Envs (e.g when the dev chain data is reset)

### Faucet (only available in demo and dev)

1. Add a valid seed hex to `faucet-api/env-vars/demo.secrets`
2. Fund the account wallet with all availabe pool currencies and the native currency

### Onboarding API

> Setup is ONLY for dev

Setup pure proxy to sign transactions (whitelisting & transfer tokens).

1. Use sudo in polkadot UI to give Alice enough currency to distribute (tokens.setBalance()). For currencyId select ForeignAsset and submit the transacton once with ForeignAsset 1 and once with ForeignAsset 2
2. Run `/initProxies` to create the pure proxy, fund it, and give it sufficient permissions
3. Copy the resulting pure proxy address and add it to the env varibles: `MEMBERLIST_ADMIN_PURE_PROXY` (onboarding-api) and `REACT_APP_MEMBERLIST_ADMIN_PURE_PROXY` (centrifuge-app)
4. Enable onboarding for each new pool under /issuer/<poolId>/investors

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

- Opening a new PR will deploy cent-app using the PR number to app-prXXX.k-f.dev - There should be a comment with these links in your PR after deployment. Forks do not trigger a PR deployment

- Merging code into `main` will deploy buckets and functions pointing to: app-dev.k-f.dev

- Demo deployments must be [manually triggered](https://github.com/centrifuge/apps/actions/workflows/demo-deploys.yml). They are not required for the release process.

- Catalyst deployments are triggered by pushing a tag containing `centrifuge-app-v*` in the tag name.

- Altair and staging are triggered by creating a `pre-release` [on the Github repository](https://github.com/centrifuge/apps/releases/new)

- Centrifuge is deployed by editing [an existing release](https://github.com/centrifuge/apps/releases) and unmarking `pre-release` to fully release it, it will promote the staging artifacts to app.centrifuge.io

- Using the github release manager the pre-release can be promoted to production ([app.centrifuge.io](https://app.centrifuge.io)) using the artifacts generated in the pre-release. The production release must be approved by a reviewer.

(Coming soon: release web-bundle to IPFS)

You can follow your deployments by going to [the Actions section](https://github.com/centrifuge/apps/actions/workflows/centrifuge-app.yml) of the github repo

HackMD docs: https://centrifuge.hackmd.io/MFsnRldyQSa4cadx11OtVg?view

## More info

More info on our release process rationale can be found in [our HackMD](https://centrifuge.hackmd.io/MFsnRldyQSa4cadx11OtVg?view) (Private link, only k-f contributors)

## How to release to staging, Altair, and Prod/Centrifuge

### 1. Create a release and mark it as a pre-release

-> Deploys to app.staging.centrifuge.io and app.altair.centrifuge.io

Navigate to create a new [pre-release](https://github.com/centrifuge/apps/releases/new). Make sure to tick the `pre-release` option.

1. Create a new `centrifuge-app-vX.YY` tag on the release screen. Only tags starting with `centrifuge-app-v*` will meet the requirements for deployments:
   - Major version: release includes new features/improvments
   - Minor version: release only includes bug fixes
2. Name the release `CentrifugeApp vX.X`
3. Generate the release notes
4. Tick the `Set as a pre-release` checkbox
5. Click `Publish release` to trigger the build. You can follow progress on the [Actions dashboard](https://github.com/centrifuge/apps/actions/workflows/staging-deploy.yml)
6. Once the build is complete, a reviewer must approve the release to trigger a deployment

When the deployment is finished a notification will be sent to the #eng-apps channel on Slack.

### 2. Create a production release

-> Deploys to app.centrifuge.io

> The deployment to staging from point 1. needs to have been finished first. The production deployment uses the artifacts generated in the pre-release.

Navigate to the [release summary](https://github.com/centrifuge/apps/releases) and select the pre-release you want to publish.

1. Untick the `Set as a pre-release` checkbox and then tick the `Set as the latest release` checkbox
2. Click `Update release` to trigger the prod deployment. As with the pre-release, the production release must be approved by a reviewer.
3. Follow your prod deployment in the [Actions dashboard](https://github.com/centrifuge/apps/actions/workflows/prod-deploy.yml)

When the deployment is finished a notification will be sent to the #eng-apps channel on Slack.
