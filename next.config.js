const withTypescript = require('@zeit/next-typescript');

module.exports = withTypescript({
  webpack(config, options) {
    // Further custom configuration here
    return config;
  }
});
