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
  }
}
