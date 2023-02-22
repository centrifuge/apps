# Faucet API

Google cloud function that transfers 1k DEVEL and 10k aUSD on request.

Requests are limited to once per address every 24 hours and no more than 100 requests total.

## Development

Create an `.env` file from the example.

If developing for demo chain please provide a seed phrase for the account funding the faucet. The corresponding env variables is `FAUCET_SEED_HEX`. If no seed if set `//Alice` will be used.

Install dependencies

```bash
yarn install
```

```bash
yarn develop
```
