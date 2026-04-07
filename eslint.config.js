import prettier from 'eslint-config-prettier'
import svelte from 'eslint-plugin-svelte'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import svelteParser from 'svelte-eslint-parser'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    ignores: [
      'build/',
      '.svelte-kit/',
      'dist/',
      'node_modules/',
      'src/lib/types/api.ts',
      // .svelte.ts files use Svelte 5 runes which ESLint's TS parser can't parse.
      // These files are still type-checked by `svelte-check` which understands runes.
      '**/*.svelte.ts',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable navigation rules for SPA mode (all navigation is client-side)
      'svelte/no-navigation-without-resolve': 'off',
      // Keys in each blocks - warning instead of error
      'svelte/require-each-key': 'warn',
      // Allow native Map in scripts (not reactive state)
      'svelte/prefer-svelte-reactivity': 'off',
    },
  }
)
