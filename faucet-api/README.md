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

Authenticate with the gcloud cli

Build the app locally

```bash
yarn build
```

Then deploy

```bash
yarn deploy
```
