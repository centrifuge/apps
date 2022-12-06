const tsconfigJson = require('./tsconfig.json')

module.exports = {
  ignorePatterns: ['node_modules', 'build', '.env', ...(tsconfigJson.exclude || [])],
  extends: ['react-app', 'react-app/jest'],
  parserOptions: {
    sourceType: 'module',
  },
}
