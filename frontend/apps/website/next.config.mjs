import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Transpile packages for monorepo support
  transpilePackages: ['@meqenet/shared', '@meqenet/shared/config'],

  // Security configurations for FinTech applications
  poweredByHeader: false, // Hide X-Powered-By header

  // Image optimization with security considerations
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'api.flexpay.et',
      },
      {
        protocol: 'https',
        hostname: 'staging-api.flexpay.et',
      },
    ],
    dangerouslyAllowSVG: false, // Prevent SVG-based attacks
    qualities: [25, 50, 75, 100],
  },

  // Security headers for financial applications
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Enable XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy for privacy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          // Content Security Policy for financial applications
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.flexpay.et https://staging-api.flexpay.et; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
          },
          // Strict Transport Security for HTTPS enforcement
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

  // API rewrites with security considerations
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

    return [
      {
        source: '/api/:path*',
        destination: apiUrl + '/:path*',
      },
    ];
  },

  // Environment variable validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Experimental features for better path resolution
  experimental: {
    // Enable webpack build worker
    webpackBuildWorker: true,
  },

  // Webpack configuration for security and path resolution
  webpack: (config, { dev }) => {
    // Security: Disable source maps in production
    if (!dev) {
      config.devtool = false;
    }

    // Add path alias for @ to src directory
    config.resolve.alias['@'] = join(__dirname, 'src');

    return config;
  },

  // Output tracing configuration - explicitly set workspace root
  outputFileTracingRoot: join(__dirname, '../../..'),
};

export default nextConfig;
