module.exports = {
  ignorePatterns: ['node_modules', '.next', 'functions', '.env', 'out'],
  extends: ['../.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['eslint-plugin-react'],
}
