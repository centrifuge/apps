const tsconfigJson = require('./tsconfig.json')

module.exports = {
  ignorePatterns: ['node_modules', '.env', 'dist', '.rpt2_cache', ...tsconfigJson.exclude],
  extends: ['../.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
}
