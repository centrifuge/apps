const tsconfigJson = require('./tsconfig.json')

module.exports = {
  ignorePatterns: ['node_modules', 'build', '.env', ...(tsconfigJson.exclude || [])],
  extends: ['../.eslintrc.js', 'react-app', 'react-app/jest', 'plugin:react/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['eslint-plugin-react'],
  rules: {
    'react/prop-types': 'off',
  },
}
