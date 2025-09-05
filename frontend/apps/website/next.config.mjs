import { composePlugins, withNx } from '@nx/next';
import withPWA from 'next-pwa';

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

/**
 * PWA Configuration
 * Implements Progressive Web App features with enterprise fintech security considerations
 */
const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Enhanced security for fintech applications
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          // Enhanced security: Don't cache any sensitive financial data
          const sensitivePatterns = [
            '/auth/',
            '/payments/',
            '/loans/',
            '/transactions/',
            '/kyc/',
            '/aml/',
            '/fraud/',
            '/ledger/',
            '/accounts/',
            '/balances/'
          ];

          if (sensitivePatterns.some(pattern => request.url.includes(pattern))) {
            return null; // Don't cache sensitive requests
          }

          // Additional check for headers that might contain sensitive data
          const headers = request.headers || {};
          if (headers['authorization'] || headers['x-api-key'] || headers['cookie']) {
            return null; // Don't cache authenticated requests
          }

          return request;
        },
        cacheWillUpdate: async ({ response }) => {
          // Only cache successful responses
          if (!response || response.status !== 200) {
            return null;
          }
          return response;
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          // Ensure no sensitive data in image requests
          if (request.url.includes('/secure/') || request.url.includes('/private/')) {
            return null;
          }
          return request;
        },
      },
    },
    {
      urlPattern: /\.(?:css|js)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-assets-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ],
  // Security exclusions for build artifacts
  buildExcludes: [
    /manifest\.json$/,
    /sw\.js$/,
    /workbox-.*\.js$/,
    // Exclude sensitive files from service worker cache
    /.*\.env.*$/,
    /config.*\.json$/,
    /secrets.*\.json$/,
  ],
  // Additional security options
  additionalManifestEntries: [
    {
      name: 'Meqenet BNPL',
      short_name: 'Meqenet',
      description: 'Secure Buy Now Pay Later platform for Ethiopian market',
      theme_color: '#1f2937',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait-primary',
      scope: '/',
      start_url: '/',
      categories: ['finance', 'business'],
      lang: 'en',
      dir: 'ltr',
    },
  ],
};

const plugins = [
  withNx,
  [withPWA, pwaConfig],
];

export default composePlugins(...plugins)(nextConfig);
