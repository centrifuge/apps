# e2e-tests
End-to-end test suite for Tinlake.

See https://cucumber.io/docs/bdd/ for an introduction into Cucumber.

## Install
1. Make sure you are on a stable node version, v12.16.3 on the time of writing this (the sha3 dependency did not work with newer versions in some cases): `nvm use`
2. Install dependencies with `npm install`

## Usage
Add an `.env` file with the right environment variables.

Run all tests: `npm test`

Run a specific test: `npm test -- features/[name].feature`

## Debugging

1. Set `devtools: true` in `features/support/browser-actions.ts`
2. Somewhere in your testing steps/code, add `await debug(this)` (`import { debug } from './utils/debug'`)

### Workaround for Firewall popup showing up on OS X

`sudo codesign --force --deep --sign - ./node_modules/puppeteer/.local-chromium/mac-756035/chrome-mac/Chromium.app`