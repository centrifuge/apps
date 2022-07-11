# Centrifuge App

## Data and UI Architecture

- `centrifuge-js`: fetch data from the chain or subquery.
- `fabric`: all design system elements (run storybook in fabric to see everything available).
- [Netfliy functions](https://docs.netlify.com/functions/overview/): reading data from IPFS can be done directly from the frontend. However writing data to IPFS (pinning) is handled by serverless netfliy functions (`/lambdas`).

## Commands

### `yarn start`

Running `yarn start` will start the following processes:

- `netlify dev`, which will run a local development server including the lambda proxy. It runs `yarn start:app` under the hood (defined in `./netlify.toml`), to start the [`vite`](https://vitejs.dev/guide/) local server
- `yarn start:deps`, which will start a development mode on the dependencies (`fabric` & `centrifuge-js`), to allow HMR to work when making changes

### `yarn build`

Build all dependencies, lambdas and app.

## Other useful information

This app uses [`vite`](https://vitejs.dev/guide/) but serve, build and bundle.

To reference env variables in code please use the vite standard `import.meta.env.ENV_VARIABLE`.

> in Netlify functions you still need to reference env variables with `process.env`

## Deployments

### Altair app

| Env          | Action                                              | Deployed URLs                                                          |
| ------------ | --------------------------------------------------- | ---------------------------------------------------------------------- |
| dev and demo | push to `main` branch                               | https://dev.app.altair.cntrfg.com & https://demo.app.altair.cntrfg.com |
| staging      | push to `rc/centrifuge-app/altair/release-*` branch | https://staging.app.altair.cntrfg.com/                                 |
| production   | tag `centrifuge-app/altair/release-*`               | https://app.altair.network/                                            |

### Centrifuge app

| Env          | Action                                       | Deployed URLs                                            |
| ------------ | -------------------------------------------- | -------------------------------------------------------- |
| dev and demo | push to `main` branch                        | https://dev.app.cntrfg.com & https://demo.app.cntrfg.com |
| staging      | push to `rc/centrifuge-app/release-*` branch |                                                          |
| production   | tag `centrifuge-app/release-*`               |                                                          |
