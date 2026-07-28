/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/Gruni-',
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
