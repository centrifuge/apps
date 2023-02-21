# Centrifuge App

## Data and UI Architecture

- `centrifuge-js`: fetch data from the chain or subquery.
- `fabric`: all design system elements (run storybook in fabric to see everything available).

## Commands

#### `yarn start`

Running `yarn start` will start the following processes:
Start a development server that watches the different workspace modules and the react app (using Vite)

#### `yarn start:deps`  
It will start a development mode on the dependencies (`fabric` & `centrifuge-js`), to allow HMR to work when making changes

#### `yarn build` or `yarn build --mode $ENV` or `yarn build immutable`

Build all dependencies, functions, and app with libraries.

## Other useful information

This app uses [`vite`](https://vitejs.dev/guide/) but serve, build and bundle.

To reference env variables in code please use the vite standard `import.meta.env.ENV_VARIABLE`.

Check the Vite  configuration file to find where we keep env file. Vite automatically grabs the right file when building with the `--mode` flag. [More info here](https://vitejs.dev/guide/env-and-mode.html)

> in Netlify functions you still need to reference env variables with `process.env`

## Deployments

Up-to-date info in k-f's Knowledge Base: 

https://centrifuge.hackmd.io/MFsnRldyQSa4cadx11OtVg?view#Environments-amp-Deployments