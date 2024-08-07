import eslintAstroSvelte from 'eslint-config-astro-svelte-jsdoc-standard'

export default [
  ...eslintAstroSvelte, {
    rules: {
      '@typescript-eslint/no-dynamic-delete': 'off', 
    }
  }
]