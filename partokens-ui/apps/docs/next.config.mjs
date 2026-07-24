import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  assetPrefix: '/_docs',
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  poweredByHeader: false,
  reactStrictMode: true,
  output: 'standalone',
}

export default withMDX(config)
