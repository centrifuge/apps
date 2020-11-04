# e2e-tests
End-to-end test suite for Tinlake.

## Setup
1. Use Node v12.18.3: `nvm use`
2. Install dependencies: `npm install`
3. Add a `.env` file with the right environment variables.

## Usage
Run all tests: `npm test`

Run a specific feature file: `npm test -- features/[name].feature`

Run a specific scenario: `npm test -- --name "[scenario_name]"`

## Debugging

1. Set `devtools: true` in `features/support/browser-actions.ts`
2. Somewhere in your testing steps/code, add `await debug(this)` (`import { debug } from './utils/debug'`)

### Workaround for Firewall popup showing up on OS X

`sudo codesign --force --deep --sign - ./node_modules/puppeteer/.local-chromium/mac-756035/chrome-mac/Chromium.app`