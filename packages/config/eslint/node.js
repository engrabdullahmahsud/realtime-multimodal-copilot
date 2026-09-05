/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./base.js'],
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  rules: {
    // Node.js specific
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'error',
  },
};