module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  ignorePatterns: ['node_modules', '.next', 'functions', '.env', 'out'],
  extends: ['prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['eslint-plugin-react', '@typescript-eslint/eslint-plugin'],
  rules: {
    'no-plusplus': 'error',
    'prefer-arrow-callback': 'error',
    'no-new-func': 'error',
    'no-else-return': 'error',
    'arrow-parens': ['error', 'always'],
    'brace-style': ['off', 'off'],
    'comma-dangle': 'off',
    curly: ['error', 'multi-line'],
    'eol-last': 'off',
    eqeqeq: ['error', 'smart'],
    'id-denylist': 'off',
    'id-match': 'off',
    indent: 'off',
    'linebreak-style': 'off',
    'max-len': 'off',
    'new-parens': 'off',
    'newline-per-chained-call': 'off',
    'no-array-constructor': 'error',
    'no-duplicate-imports': 'error',
    'no-eval': 'error',
    'no-extra-semi': 'off',
    'no-irregular-whitespace': 'off',
    'no-multiple-empty-lines': 'off',
    'no-new-wrappers': 'error',
    'no-param-reassign': 'error',
    'no-trailing-spaces': 'off',
    'no-underscore-dangle': 'off',
    'no-var': 'error',
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'padded-blocks': [
      'off',
      {
        blocks: 'never',
      },
      {
        allowSingleLineBlocks: true,
      },
    ],
    'prefer-const': 'error',
    'prefer-template': 'error',
    'quote-props': 'off',
    quotes: 'off',
    radix: 'error',
    'react/jsx-curly-spacing': 'off',
    'react/jsx-equals-spacing': 'off',
    'react/jsx-tag-spacing': [
      'off',
      {
        afterOpening: 'allow',
        closingSlash: 'allow',
      },
    ],
    'react/jsx-wrap-multilines': 'off',
    semi: 'off',
    'space-before-function-paren': 'off',
    'space-in-parens': ['off', 'never'],
    'spaced-comment': [
      'error',
      'always',
      {
        markers: ['/'],
      },
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: ['function'],
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: ['method'],
        format: ['camelCase'],
      },
      {
        selector: ['typeLike'],
        format: ['PascalCase'],
      },
    ],
    '@typescript-eslint/no-array-constructor': 'error',
    '@typescript-eslint/no-this-alias': 'error',
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
    '@typescript-eslint/quotes': 'off',
    '@typescript-eslint/semi': ['off', null],
    '@typescript-eslint/type-annotation-spacing': 'off',
  },
}
