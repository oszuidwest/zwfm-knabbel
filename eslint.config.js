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
      'src/lib/api/generated/',
      // Runes in .svelte.ts are checked by svelte-check.
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
      // Route helpers resolve internal hrefs at render/navigation boundaries.
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/require-each-key': 'warn',
      // Plain Map instances are allowed outside reactive Svelte state.
      'svelte/prefer-svelte-reactivity': 'off',
    },
  }
)
