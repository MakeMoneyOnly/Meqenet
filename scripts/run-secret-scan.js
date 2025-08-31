const { spawnSync, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const trufflehogignorePath = path.join(cwd, '.trufflehogignore');

// Check if Docker is available
function isDockerAvailable() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Simple pattern-based secret detection as fallback
function simpleSecretScan() {
  console.log(
    '🔍 Running simple pattern-based secret scan (Docker not available)...'
  );

  const patterns = [
    /\b[A-Za-z0-9+/]{40}\b/g, // GitHub tokens (40 chars)
    /\b[A-Za-z0-9+/]{32}\b/g, // Generic API keys (32 chars)
    /\b[A-Za-z0-9+/]{64}\b/g, // JWT secrets (64 chars)
    /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi, // Private keys
    /\b(sk|pk)_\w{20,}/gi, // Stripe/Similar API keys
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email patterns (but skip common ones)
  ];

  const excludeDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.nuxt',
  ];
  const excludeExtensions = [
    '.lock',
    '.log',
    '.md',
    '.json',
    '.yml',
    '.yaml',
    '.xml',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.ico',
    '.woff',
    '.woff2',
  ];

  let totalFiles = 0;
  let suspiciousFiles = 0;

  function scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!excludeDirs.includes(item) && !item.startsWith('.')) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (!excludeExtensions.includes(ext) && stat.size < 1024 * 1024) {
            // Skip files > 1MB
            totalFiles++;
            const content = fs.readFileSync(fullPath, 'utf8').catch(() => '');
            if (content) {
              let hasSuspicious = false;
              for (const pattern of patterns) {
                if (pattern.test(content)) {
                  hasSuspicious = true;
                  break;
                }
              }
              if (hasSuspicious) {
                suspiciousFiles++;
                console.log(`⚠️  Suspicious patterns found in: ${fullPath}`);
              }
            }
          }
        }
      }
    } catch (error) {
      // Skip files/directories that can't be read
    }
  }

  scanDirectory(cwd);

  console.log(
    `📊 Scan completed: ${totalFiles} files scanned, ${suspiciousFiles} with suspicious patterns`
  );

  if (suspiciousFiles > 0) {
    console.log('⚠️  Suspicious patterns detected! Manual review recommended.');
    console.log(
      '💡 Note: This is a basic pattern scan. Consider using Trufflehog when Docker is available.'
    );
    process.exit(1);
  } else {
    console.log('✅ No obvious secrets detected with pattern scan');
  }
}

if (isDockerAvailable()) {
  console.log(
    '🐳 Docker available, using Trufflehog for comprehensive secret scanning...'
  );

  const command = `docker run --rm -v "${cwd}:/repo" -v "${trufflehogignorePath}:/.trufflehogignore" trufflesecurity/trufflehog:latest filesystem --only-verified --no-update --fail --json /repo -x /.trufflehogignore`;

  console.log(`Running secret scan with command: ${command}`);

  const result = spawnSync(command, [], {
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    console.error('Failed to start subprocess for secret scan.', result.error);
    process.exit(1);
  }

  process.exit(result.status);
} else {
  console.log(
    '🐳 Docker not available, falling back to pattern-based scanning...'
  );
  simpleSecretScan();
}
