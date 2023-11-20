const synpress = require('@synthetixio/synpress/plugins/index.js')
const { defineConfig } = require('cypress')

export default defineConfig({
  projectId: 'cwss36', // cypress cloud
  userAgent: 'synpress',
  retries: {
    runMode: 0,
    openMode: 0,
  },

  screenshotsFolder: 'e2e/screenshots',
  videosFolder: 'e2e/videos',
  video: true,
  chromeWebSecurity: true,
  viewportWidth: 1366,
  viewportHeight: 850,

  env: {
    coverage: false,
  },
  defaultCommandTimeout: 10000,
  pageLoadTimeout: 10000,
  requestTimeout: 10000,

  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      return synpress(on, config)
    },
    supportFile: 'e2e/support/e2e.ts',
    specPattern: 'e2e/specs/**/*.cy.ts',
  },
})
