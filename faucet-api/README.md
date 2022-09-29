# Faucet API

Google cloud function that transfers 1k DEVEL and 10k aUSD on request.

Requests are limited to once per address every 24 hours and no more than 100 requests total.

## Development

Create an `.env.yaml` file from the example

Install dependencies

```bash
yarn install
```

```bash
yarn develop
```

## Deployment

Install the [gcloud cli](https://cloud.google.com/sdk/docs/install) and authenticate with your centrifuge account.

```bash
gcloud auth login
```

Build the app locally

```bash
yarn build
```

Then deploy

```bash
yarn deploy
```
