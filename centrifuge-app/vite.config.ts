import react from '@vitejs/plugin-react'
import { defineConfig, splitVendorChunkPlugin } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
// when making changes to this file start vite with --force flag
export default defineConfig({
  server: {
    watch: {
      // configuration to allow HMR in other modules in yarn
      ignored: ['!../centrifuge-js/dist/**', '!../fabric/dist/**'],
    },
    port: 3000,
  },
  envPrefix: 'REACT_APP_',
  envDir: '.env-config',
  build: {
    target: 'esnext',
    outDir: 'build',
    commonjsOptions: {
      // ensure all packages are converted to ES6 for rollup bundle
      include: [/node_modules/],
    },
    sourcemap: true,
  },
  resolve: {
    // resolve every package version to the one in this projects package.json
    dedupe: [
      'styled-components',
      'react',
      'styled-system',
      '@polkadot/util-crypto',
      '@polkadot/api',
      'decimal.js-light',
      'bn.js',
    ],
  },
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-styled-components'],
      },
    }),
    // The Coinbase and WalletConnect connectors rely on node globals
    nodePolyfills(),
    splitVendorChunkPlugin(),
  ],
})
