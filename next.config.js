require('dotenv').config()
require('ts-node').register({ project: './tsconfig.json', compilerOptions: { module: 'CommonJS' }, files: true })
const config = require('./config')

module.exports = {
  webpack(config, options) {
    // Further custom configuration here
    return {
      ...config,
      node: {
        fs: 'empty',
        child_process: 'empty',
        net: 'empty',
      },
    }
  },
  experimental: {
    exportTrailingSlash: false,
  },
  async redirects() {
    const redirects =  [
      // redirects /[ID] to /pool/[ID], examples:
      //   - `/0xbb53072d054de55d56dbb4ee95840de3262e4097` to `/pool/0xbb53072d054de55d56dbb4ee95840de3262e4097`
      //   - `/0xbb53072d054de55d56dbb4ee95840de3262e4097/assets` to `/pool/0xbb53072d054de55d56dbb4ee95840de3262e4097/assets`
      {
        source: '/:root(0x[a-f0-9]{40})/:rest*',
        destination: '/pool/:root/:rest*',
        permanent: true,
      },

      // redirects /pool/[ID] to /pool/[ID]/[alias], examples:
      //   - `/pool/0xbb53072d054de55d56dbb4ee95840de3262e4097` to `/pool/0xbb53072d054de55d56dbb4ee95840de3262e4097/kovan-staging-1`
      ...config.default.pools.map(p => ({
        source: `/pool/${p.addresses.ROOT_CONTRACT}`,
        destination: `/pool/${p.addresses.ROOT_CONTRACT}/${p.metadata.slug}`,
        permanent: true,
      })),

      // redirects /pool/[ID]/* to /pool/[ID]/[alias]/*, examples:
      //   - `/pool/0xbb53072d054de55d56dbb4ee95840de3262e4097/assets` to `/pool/0xbb53072d054de55d56dbb4ee95840de3262e4097/kovan-staging-1/assets`
      ...config.default.pools.map(p => ({
        source: `/pool/${p.addresses.ROOT_CONTRACT}/:rest(assets|demo|investments)/:rest2*`,
        // NOTE: negative lookaheads like the one below don't work in next.js' redirect feature
        // source: `/pool/${p.addresses.ROOT_CONTRACT}/:rest((?!${p.metadata.slug}))/:rest2*`,
        destination: `/pool/${p.addresses.ROOT_CONTRACT}/${p.metadata.slug}/:rest/:rest2*`,
        permanent: true,
      })),

      // redirects /pool/[alias] to /pool/[ID]/[alias], examples:
      //   - `/pool/kovan-staging-1` to `/pool/0xbb53072d054de55d56dbb4ee95840de3262e4097/kovan-staging-1`
      //   - `/pool/kovan-staging-1/assets` to `/pool/0xbb53072d054de55d56dbb4ee95840de3262e4097/kovan-staging-1/assets`
      ...config.default.pools.map(p => ({
        source: `/pool/${p.metadata.slug}/:rest*`,
        destination: `/pool/${p.addresses.ROOT_CONTRACT}/${p.metadata.slug}/:rest*`,
        permanent: true,
      })),

    ]

    return redirects
  },
}
