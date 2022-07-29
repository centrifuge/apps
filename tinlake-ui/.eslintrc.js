const tsconfigJson = require('./tsconfig.json')

module.exports = {
  ignorePatterns: ['node_modules', 'build', '.env', 'out', 'functions', ...(tsconfigJson.exclude || [])],
  extends: ['../.eslintrc.js', 'react-app', 'react-app/jest', 'plugin:react/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
  },
  plugins: ['eslint-plugin-react'],
  rules: {
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react/react-in-jsx-scope': 'off',
  },
}
