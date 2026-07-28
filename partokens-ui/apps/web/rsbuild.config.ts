import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const apiTarget = process.env.PARTOKENS_API_TARGET || 'https://partokens.com'

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss({ optimize: false })],
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  html: {
    template: './index.html',
  },
  output: {
    target: 'web',
    minify: true,
    manifest: true,
    distPath: {
      root: 'dist',
      js: '_ui/js',
      css: '_ui/css',
      image: '_ui/image',
      font: '_ui/font',
      media: '_ui/media',
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        cookieDomainRewrite: '',
      },
      '/pg': {
        target: apiTarget,
        changeOrigin: true,
        cookieDomainRewrite: '',
      },
      '/v1': {
        target: apiTarget,
        changeOrigin: true,
        cookieDomainRewrite: '',
      },
    },
  },
  performance: {
    buildCache: false,
  },
})
