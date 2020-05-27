# e2e-tests

## Recipies

### Debug the dapp

1. Set `devtools: true` in `features/support/browser-actions.ts`
2. Somewhere in your testing steps/code, add `await debug(this)` (`import { debug } from './utils/debug'`)

### Workaround for Firewall popup showing up on OS X

`sudo codesign --force --deep --sign - ./node_modules/puppeteer/.local-chromium/mac-756035/chrome-mac/Chromium.app`