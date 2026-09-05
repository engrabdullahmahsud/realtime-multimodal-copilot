/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./base.js'],
  plugins: ['react', 'react-hooks', 'jsx-a11y', 'next'],
  settings: {
    react: { version: '18.2' },
    next: { rootDir: __dirname },
  },
  rules: {
    // React rules
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/self-closing-comp': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/jsx-boolean-value': ['error', 'never'],
    'react/no-unstable-nested-components': 'warn',
    'react/no-unused-state': 'warn',
    'react/no-unused-class-component-methods': 'warn',

    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // JSX Accessibility
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    'jsx-a11y/role-has-required-aria-props': 'warn',

    // Next.js
    'next/no-html-link-for-pages': 'error',
    'next/no-img-element': 'error',
    'next/no-unwanted-polyfillio': 'warn',
  },
  overrides: [
    {
      files: ['**/*.test.tsx', '**/*.spec.tsx'],
      rules: {
        'react/no-unused-state': 'off',
      },
    },
  ],
};