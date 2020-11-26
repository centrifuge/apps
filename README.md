# apps
![e2e-tests](https://github.com/centrifuge/apps/workflows/e2e-tests/badge.svg)

Monorepo for the Tinlake applications.

## Setup
Make sure you have installed Yarn and NVM.

1. Use Node v12.18.3: `nvm use`
2. Install dependencies: `yarn install`
3. Add `.env` files with the right environment variables to `./tinlake-ui` and `./e2e-tests`.

It's also recommended to run Prettier automatically in your editor, e.g. using [this VS Code plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).