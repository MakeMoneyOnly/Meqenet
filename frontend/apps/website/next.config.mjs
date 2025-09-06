import { composePlugins, withNx } from '@nx/next';
import withPWA from 'next-pwa';
import { URL } from 'url';

/**
 * Security Headers Configuration
 * Implements comprehensive security headers for fintech application
 */
const securityHeaders = [
  // HTTPS and Security Headers
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()',
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
      'upgrade-insecure-requests',
      // Report violations (remove in production if causing issues)
      'report-uri /api/security/csp-report',
    ]
      .filter(Boolean)
      .join('; '),
  },
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
    optimizeCss: false, // Disable CSS optimization to avoid critters dependency issue
    scrollRestoration: true,
    webVitalsAttribution: ['CLS', 'LCP'],
  },

  // Configure TypeScript for Nx workspace compatibility
  typescript: {
    tsconfigPath: './tsconfig.json',
    // Disable incremental builds for Next.js compatibility with Nx
    ignoreBuildErrors: false,
  },

  // Disable webpack incremental builds
  webpack: (config, { dev, isServer }) => {
    // Add security-related webpack plugins
    if (!dev && !isServer) {
      // In production, add source maps for debugging but protect them
      config.devtool = 'hidden-source-map';
    }

    // Disable incremental builds
    config.watchOptions = {
      ...config.watchOptions,
      aggregateTimeout: 300,
      poll: false,
    };

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
      '@frontend/shared': new URL(
        '../../../libs/shared/src',
        import.meta.url,
      ).pathname.replace(/^\/([A-Z]:)/, '$1'),
      '@frontend/shared/i18n': new URL(
        '../../../libs/shared/src/i18n',
        import.meta.url,
      ).pathname.replace(/^\/([A-Z]:)/, '$1'),
      '@frontend/shared-ui': new URL(
        '../../../libs/shared-ui/src',
        import.meta.url,
      ).pathname.replace(/^\/([A-Z]:)/, '$1'),
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
            value: '1.0.0', // Version managed by package.json
          },
          {
            key: 'X-Request-ID',
            value:
              Math.random().toString(36).substring(2) + Date.now().toString(36),
          },
        ],
      },
      {
        // Special headers for payment routes
        source: '/api/payments/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Payment-Security',
            value: 'PCI-DSS-Compliant',
          },
        ],
      },
    ];
  },

  // Environment-specific configuration
  env: {
    CUSTOM_KEY: 'development-key', // Environment variable managed externally
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
      {
        source: '/((?!api/).*)',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://:host/:path*',
        permanent: true,
      },
    ];
  },

  // Rewrites for API proxying (if needed)
  async rewrites() {
    return [
      {
        source: '/api/external/:path*',
        destination: 'http://localhost:3001/:path*', // External API URL managed externally
      },
    ];
  },
};

/**
 * PWA Configuration
 * Implements Progressive Web App features with enterprise fintech security considerations
 */
const pwaConfig = {
  dest: 'public'
};

export default composePlugins(withNx, withPWA(pwaConfig))(nextConfig);
