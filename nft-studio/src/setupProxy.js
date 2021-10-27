const { createProxyMiddleware } = require('http-proxy-middleware')

/**
 * This file is only for development: it allows to call '.netlify/functions/*'
 * URLs which will be redirected to the lambda dev server created by the
 * netlify-lambda package
 */
module.exports = function (app) {
  app.use(
    '/.netlify/functions/',
    createProxyMiddleware({
      target: 'http://localhost:9000/',
      pathRewrite: {
        '^/\\.netlify/functions': '',
      },
    })
  )
}
