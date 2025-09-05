//@ts-check
/* eslint-env node */

const { composePlugins, withNx } = require('@nx/next');

/**
 * Security Headers Configuration
 * Implements comprehensive security headers for fintech application
 */
const securityHeaders = [
  // HTTPS and Security Headers
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()'
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      // Default sources
      "default-src 'self'",
      // Scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
      // Styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.stripe.com",
      // Images
      "img-src 'self' data: https: blob:",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Connect (API calls)
      "connect-src 'self' https://api.stripe.com https://*.stripe.com https://www.google-analytics.com https://*.meqenet.et wss://*.meqenet.et",
      // Frames
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      // Objects and embeds
      "object-src 'none'",
      // Base URI
      "base-uri 'self'",
      // Form actions
      "form-action 'self'",
      // Upgrade insecure requests
      "upgrade-insecure-requests",
      // Report violations (remove in production if causing issues)
      process.env.NODE_ENV === 'development' ? "report-uri /api/security/csp-report" : ""
    ].filter(Boolean).join('; ')
  }
];

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Nx-specific options
  nx: {
    svgr: false,
  },

  // Transpile shared packages
  transpilePackages: ['@frontend/shared'],

  // Disable static optimization for i18n compatibility
  experimental: {
    serverComponentsExternalPackages: [],
  },

  // Security and Performance
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // Image optimization with security
  images: {
    domains: ['*.meqenet.et', 'localhost'],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Experimental features for performance
  experimental: {
    optimizeCss: false, // Disable CSS optimization to avoid critters dependency issue
    scrollRestoration: true,
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  // Headers configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Additional headers for API routes
        source: '/api/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'X-API-Version',
            value: process.env.npm_package_version || '1.0.0'
          },
          {
            key: 'X-Request-ID',
            value: crypto.randomUUID()
          }
        ],
      },
      {
        // Special headers for payment routes
        source: '/api/payments/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'X-Payment-Security',
            value: 'PCI-DSS-Compliant'
          }
        ],
      }
    ];
  },

  // Webpack configuration for security and TypeScript support
  webpack: (config, { dev, isServer }) => {
    // Add security-related webpack plugins
    if (!dev && !isServer) {
      // In production, add source maps for debugging but protect them
      config.devtool = 'hidden-source-map';
    }

    // Add custom webpack rules for security and TypeScript
    config.module.rules.push({
      test: /\.js$/,
      enforce: 'pre',
      use: ['source-map-loader'],
      exclude: /node_modules/,
    });


    // Add path aliases for Nx workspace libraries
    config.resolve.alias = {
      ...config.resolve.alias,
      '@frontend/shared': require('path').resolve(__dirname, '../../../libs/shared/src'),
      '@frontend/shared/i18n': require('path').resolve(__dirname, '../../../libs/shared/src/i18n'),
      '@frontend/shared-ui': require('path').resolve(__dirname, '../../../libs/shared-ui/src'),
    };

    // Ensure TypeScript extensions are resolved
    config.resolve.extensions = [
      '.tsx',
      '.ts',
      '.js',
      '.jsx',
      ...(config.resolve.extensions || []),
    ];

    return config;
  },

  // Environment-specific configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Redirects for security
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/api/auth/login',
        permanent: false,
      },
      // Redirect HTTP to HTTPS in production
      ...(process.env.NODE_ENV === 'production' ? [{
        source: '/((?!api/).*)',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://:host/:path*',
        permanent: true,
      }] : []),
    ];
  },

  // Rewrites for API proxying (if needed)
  async rewrites() {
    return [
      {
        source: '/api/external/:path*',
        destination: `${process.env.EXTERNAL_API_URL || 'http://localhost:3001'}/:path*`,
      },
    ];
  },
};

const plugins = [
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
