require('dotenv').config()

module.exports = {
  webpack(config, options) {
    // Further custom configuration here
    return {
      ...config,
      node: {
        fs: 'empty',
        child_process: 'empty',
        net: 'empty'
      }
    }
  },
  experimental: {
    exportTrailingSlash: false,
  },
};
