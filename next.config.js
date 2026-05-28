/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // xlsx usa APIs de browser — não tenta resolver no servidor
      config.externals = [...(config.externals || []), 'xlsx']
    }
    return config
  },
}
module.exports = nextConfig
