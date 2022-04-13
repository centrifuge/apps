# NFT Studio

## Commands

### yarn start

Running `yarn start` will start the following processes:

- `netlify dev`, which will run a local development server including the lambda proxy. It runs `yarn start:app` under the hood (defined in `./netlify.toml`), to start the (`vite`)[https://vitejs.dev/guide/] local server
- `yarn start:deps`, which will start a development mode on the dependencies (e.g. `fabric`), to allow HMR to work when making changes to `fabric` components

### yarn build

Build all dependencies, lambdas and app.
