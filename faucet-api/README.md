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

The function is [deployed on google cloud](https://console.cloud.google.com/functions/list?env=gen1&project=peak-vista-185616&tab=logs).

Install the [gcloud cli](https://cloud.google.com/sdk/docs/install) and authenticate with your centrifuge account.

```bash
gcloud auth login
```

Build the app locally

```bash
yarn build
```

Then deploy to develop or demo

```bash
yarn deploy:demo
yarn deploy:dev
```
