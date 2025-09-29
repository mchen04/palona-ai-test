/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint will run during production builds but not fail on warnings
    ignoreDuringBuilds: false,
    // Specify directories to lint
    dirs: ['app', 'components', 'lib', 'hooks'],
  },
  typescript: {
    // Now TypeScript errors will fail the build
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Enable strict mode for better React error handling
  reactStrictMode: true,
  // Enable SWC minification for better performance
  swcMinify: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Experimental features for better performance
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      'lucide-react',
    ],
  },
}

export default nextConfig
