import { defineConfig } from 'astro/config'
// https://astro.build/config

import tailwind from '@astrojs/tailwind'
import svelte from '@astrojs/svelte'

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), svelte()],
  base: '/',
  outDir: 'dist',
  build: {
    format: 'file'
  },
  vite: {
    server: {
      https: {
        cert: process.env.LOCAL_CERT,
        key: process.env.LOCAL_KEY
      }
    }
  }
})
