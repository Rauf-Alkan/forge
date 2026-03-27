/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['fluent-ffmpeg'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
}
module.exports = nextConfig
