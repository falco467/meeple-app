import eslint from '@eslint/js'
import globals from 'globals'
import tsEslint from 'typescript-eslint'
// TODO: Wait for love to support eslint 9 and flat config: https://github.com/mightyiam/eslint-config-love/issues/1589
// import love from 'eslint-config-love'

export default [
  eslint.configs.recommended,
  ...tsEslint.configs.strictTypeChecked,
  ...tsEslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        projectService: true,
      },
      globals: {
        ...globals.browser
      }
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { "argsIgnorePattern": "^_" }
      ],
      '@typescript-eslint/restrict-template-expressions': 'off',
    },
  },
]
