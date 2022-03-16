const tsconfigJson = require('./tsconfig.json')

module.exports = {
  root: true,
  ignorePatterns: ['node_modules', 'build', '.env', ...(tsconfigJson.exclude || [])],
  extends: ['react-app'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    'react/prop-types': 'off',
    'react/display-name': 'off',
  },
}
