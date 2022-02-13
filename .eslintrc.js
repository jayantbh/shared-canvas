module.exports = {
  env: {
    browser: true,
    es2021: true,
    commonjs: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    requireConfigFile: false,
  },
  plugins: ['@babel'],
  rules: {
    'no-underscore-dangle': 'off',
    'lines-between-class-members': 'off',
    'func-names': 'off',
    'import/prefer-default-export': 'off',
    'no-continue': 'off',
    'no-new': 'off',
  },
};
