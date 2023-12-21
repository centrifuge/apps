const tsconfigJson = require('./tsconfig.json')
const path = require('path')
const synpressPath = path.join(process.cwd(), '/node_modules/@synthetixio/synpress')

module.exports = {
  ignorePatterns: ['node_modules', 'build', '.env', ...(tsconfigJson.exclude || [])],
  extends: ['react-app', 'react-app/jest', `${synpressPath}/.eslintrc.js`],
  parserOptions: {
    sourceType: 'module',
  },
}
