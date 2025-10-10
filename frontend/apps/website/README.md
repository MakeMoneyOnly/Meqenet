# Meqenet Website - Frontend Application

## 📱 Progressive Web App (PWA) - Next.js 15

Ethiopia's premier BNPL (Buy Now, Pay Later) financial super-app frontend, built with Next.js 15 App Router and Serwist PWA capabilities.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v22 LTS or higher
- **pnpm**: v10 or higher
- **Git**: Latest version

### Installation

```bash
# Navigate to the website directory
cd frontend/apps/website

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Visit http://localhost:3001
```

### Build for Production

```bash
# Set production environment
export NODE_ENV=production  # Linux/Mac
# OR
$env:NODE_ENV="production"  # Windows PowerShell

# Build the application
pnpm build

# Start production server
pnpm start
```

---

## 🎯 Key Features

### Progressive Web App (PWA)
- ✅ **Offline Support**: Full offline functionality with service worker
- ✅ **Installable**: Add to home screen on mobile and desktop
- ✅ **Push Notifications**: Payment reminders and account updates
- ✅ **Cache-First Strategy**: Fast loading with intelligent caching
- ✅ **Auto-Updates**: Seamless updates with background sync

### Ethiopian Localization
- 🇪🇹 **Amharic Support**: Full RTL language support
- 📅 **Ethiopian Calendar**: Native calendar integration
- 💰 **Ethiopian Birr (ETB)**: Proper currency formatting
- 🎉 **Cultural Holidays**: Timkat, Meskel, Ethiopian New Year

### Financial Features
- 💳 **BNPL Integration**: Multiple payment plan options
- 🔒 **PCI DSS Compliant**: Level 1 security standards
- 🔐 **Fayda ID Integration**: National ID verification (eKYC)
- 📱 **Mobile Money**: Telebirr, M-Pesa, CBE Birr support

### User Experience
- ⚡ **Fast Performance**: < 3s load time on 3G networks
- 📱 **Mobile-First Design**: Optimized for Ethiopian devices
- ♿ **Accessible**: WCAG 2.1 AA compliance
- 🌓 **Theme Support**: Light and dark mode

---

## 📁 Project Structure

```
frontend/apps/website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with metadata
│   │   ├── page.tsx           # Home page
│   │   ├── error.tsx          # Error boundary
│   │   ├── not-found.tsx      # 404 page
│   │   ├── sw.ts              # Service worker (Serwist)
│   │   └── ~offline/          # Offline fallback page
│   ├── components/            # React components
│   │   ├── common/            # Shared components
│   │   ├── landing/           # Landing page sections
│   │   └── providers/         # Context providers
│   │       └── PWAProvider.tsx # PWA registration
│   ├── lib/                   # Utilities
│   │   └── security/          # Security utilities
│   └── types/                 # TypeScript definitions
├── public/                    # Static assets
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Generated service worker
│   └── assets/               # Images, fonts, icons
├── next.config.mjs           # Next.js configuration
├── tailwind.config.mjs       # Tailwind CSS configuration
├── eslint.config.mjs         # ESLint configuration
└── package.json              # Dependencies
```

---

## 🛠️ Technology Stack

### Core Framework
- **Next.js**: 15.3.0 (App Router)
- **React**: 19.1.0
- **TypeScript**: 5.8.3

### PWA & Service Worker
- **Serwist**: 9.2.1 (PWA toolkit)
- **@serwist/next**: 9.2.1 (Next.js integration)
- **@serwist/strategies**: 9.2.1 (Caching strategies)

### Styling
- **Tailwind CSS**: 3.4.17
- **Framer Motion**: 12.18.0 (Animations)
- **GSAP**: 3.13.0 (Advanced animations)

### UI Components
- **Radix UI**: Accessible primitives
- **Headless UI**: Unstyled components
- **Lucide React**: Icons

### Security & Compliance
- **Helmet**: Security headers
- **Jose**: JWT handling
- **bcryptjs**: Password hashing
- **Zod**: Runtime validation

### Development Tools
- **ESLint**: 9.29.0 (with Next.js plugin)
- **Prettier**: Code formatting
- **Vitest**: Unit testing
- **Husky**: Git hooks

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Environment
NODE_ENV=production

# Security (production only)
NEXT_PUBLIC_CSP_NONCE=your-csp-nonce-here
```

### PWA Configuration

**File**: `next.config.mjs`

```javascript
const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',                    // Service worker source
  swDest: 'public/sw.js',                     // Output destination
  cacheOnNavigation: true,                    // Cache navigation requests
  reloadOnOnline: true,                       // Reload when back online
  disable: process.env.NODE_ENV === 'development', // Disable in dev
});
```

### Manifest Configuration

**File**: `public/manifest.json`

```json
{
  "name": "Meqenet - BNPL Ethiopia",
  "short_name": "Meqenet",
  "description": "Buy Now, Pay Later - Ethiopia's Financial Super-App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1f2937",
  "theme_color": "#1f2937",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 📝 Available Scripts

### Development
```bash
pnpm dev          # Start development server (port 3001)
pnpm build        # Build for production
pnpm start        # Start production server
```

### Code Quality
```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint errors
pnpm test         # Run unit tests
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage
```

### Security
```bash
pnpm security:audit  # Run security audit
pnpm security:fix    # Fix security vulnerabilities
```

### Maintenance
```bash
pnpm clean        # Clean build artifacts
pnpm reinstall    # Fresh install of dependencies
```

---

## 🔒 Security Features

### Headers
- **CSP**: Content Security Policy enabled
- **HSTS**: Strict Transport Security
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME sniffing prevention

### Data Protection
- **No PII in Logs**: Structured logging with redaction
- **Token Security**: Secure JWT handling
- **Input Validation**: Zod schema validation
- **XSS Prevention**: React's built-in protection + CSP

### Compliance
- ✅ **PCI DSS Level 1**: Payment card industry compliance
- ✅ **WCAG 2.1 AA**: Web accessibility standards
- ✅ **GDPR**: Data protection regulations
- ✅ **NBE**: Ethiopian banking regulations

---

## 🌐 PWA Features

### Offline Support
The application works offline with cached pages and assets:
- Home page
- Product catalogs
- User account information (read-only)
- Previously visited pages

### Push Notifications
Receive notifications for:
- Payment reminders
- Account updates
- Special offers
- Transaction confirmations

### Installation
Users can install the app on:
- **Android**: Chrome, Edge
- **iOS**: Safari (Add to Home Screen)
- **Desktop**: Chrome, Edge, Safari

---

## 🐛 Troubleshooting

### Build Errors

#### Issue: `<Html> should not be imported`
**Solution**: This was fixed in v2.0.0 by migrating to Serwist. If you encounter this:

```bash
# Clean all caches
rm -rf .next .turbo node_modules/.cache

# Reinstall dependencies
pnpm store prune
pnpm install --force

# Rebuild
export NODE_ENV=production
pnpm build
```

#### Issue: Service Worker Not Registering
**Checklist**:
1. Verify `public/sw.js` exists after build
2. Check HTTPS is enabled (or using localhost)
3. Clear browser service workers
4. Check browser console for errors

#### Issue: PWA Not Installable
**Requirements**:
- HTTPS connection
- Valid manifest.json
- Service worker registered
- Meets PWA criteria (Lighthouse audit)

### Development Issues

#### Issue: Hot Reload Not Working
```bash
# Restart dev server
pnpm dev
```

#### Issue: TypeScript Errors
```bash
# Check TypeScript configuration
pnpm tsc --noEmit
```

---

## 📚 Documentation

### Main Documentation
- [PWA Migration Guide](../../../docs/PWA_MIGRATION_NEXTPWA_TO_SERWIST.md)
- [Changelog](../../../docs/CHANGELOG_PWA_IMPROVEMENTS.md)
- [Architecture Overview](../../../docs/Stage 1 - Foundation/Architecture.md)
- [Security Guidelines](../../../docs/Stage 1 - Foundation/Security.md)

### API Documentation
- [REST API Docs](http://localhost:3001/api-docs) (when running locally)
- [API Integration Guide](../../../docs/Stage 2-Development/API_Integration.md)

### Component Documentation
- Component Storybook (coming soon)
- Accessibility Guide
- Styling Guidelines

---

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test path/to/test.spec.ts

# Coverage report
pnpm test:coverage
```

### End-to-End Tests
```bash
# Run e2e tests
pnpm test:e2e

# Run specific test
pnpm test:e2e --grep "login flow"
```

### Accessibility Tests
```bash
# Run a11y audit
pnpm test:a11y
```

---

## 🚀 Deployment

### Production Build

```bash
# 1. Set environment
export NODE_ENV=production

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Build application
pnpm build

# 4. Verify build
ls -la .next/
ls -la public/sw.js

# 5. Start server
pnpm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t meqenet-website .

# Run container
docker run -p 3001:3001 meqenet-website
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

---

## 🤝 Contributing

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **Prettier**: Auto-format on save
- **Commits**: Conventional commits with ticket references

### PR Checklist
- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] TypeScript compiles (`pnpm build`)
- [ ] Accessibility tested
- [ ] Security review completed
- [ ] Documentation updated

---

## 📊 Performance Metrics

### Build Metrics
- **Build Time**: ~18 seconds
- **Bundle Size**: 103 kB (First Load JS)
- **Service Worker**: ~8 kB (gzipped)

### Lighthouse Scores (Target)
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 95
- **SEO**: > 95
- **PWA**: 100

---

## 🆘 Support

### Getting Help
1. Check [Troubleshooting](#troubleshooting) section
2. Review [Documentation](#documentation)
3. Check existing GitHub issues
4. Contact development team

### Reporting Issues
When reporting issues, include:
- Node.js version (`node -v`)
- pnpm version (`pnpm -v`)
- Operating system
- Error messages
- Steps to reproduce

---

## 📜 License

Copyright © 2025 Meqenet. All rights reserved.

---

## 🎉 Changelog

See [CHANGELOG_PWA_IMPROVEMENTS.md](../../../docs/CHANGELOG_PWA_IMPROVEMENTS.md) for recent changes.

### Latest Version: 2.0.0
- ✅ Migrated from next-pwa to Serwist
- ✅ Fixed Next.js 15 App Router compatibility
- ✅ Added ESLint Next.js plugin
- ✅ Improved security warnings handling
- ✅ Updated viewport/themeColor configuration

---

**Built with ❤️ for Ethiopia**
