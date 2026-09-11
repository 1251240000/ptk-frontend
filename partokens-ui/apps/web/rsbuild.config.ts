import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const apiTarget = process.env.PARTOKENS_API_TARGET || 'http://localhost:3000'
const adminApiTarget = process.env.PARTOKENS_ADMIN_API_TARGET || 'http://127.0.0.1:8081'

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss({ optimize: false })],
  source: {
    entry: {
      index: './src/main.tsx',
    },
    define: {
      'import.meta.env.PUBLIC_PARTOKENS_SOURCE_URL': JSON.stringify(process.env.PUBLIC_PARTOKENS_SOURCE_URL || ''),
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
    historyApiFallback: true,
    publicDir: [
      { name: path.resolve(rootDir, 'public') },
      { name: path.resolve(rootDir, '../../config'), copyOnBuild: true },
    ],
    proxy: {
      '/admin-api': {
        target: adminApiTarget,
        changeOrigin: true,
        pathRewrite: { '^/admin-api': '' },
      },
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
