const synpress = require('@synthetixio/synpress/plugins/index.js')
const { defineConfig } = require('cypress')

export default defineConfig({
  userAgent: 'synpress',
  retries: {
    runMode: 0,
    openMode: 0,
  },

  screenshotsFolder: 'tests/e2e/screenshots',
  videosFolder: 'tests/e2e/videos',
  video: true,
  chromeWebSecurity: true,
  viewportWidth: 1366,
  viewportHeight: 850,

  env: {
    coverage: false,
    walletAddress: '0x70fC4d9C87E9e9B0751A5680b1Dd654517f02309',
  },
  defaultCommandTimeout: 10000,
  pageLoadTimeout: 10000,
  requestTimeout: 10000,

  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      return synpress(on, config)
    },
    supportFile: 'tests/e2e/support/e2e.ts',
    specPattern: 'tests/e2e/specs/**/*.cy.ts',
  },
})
