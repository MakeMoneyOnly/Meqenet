#!/usr/bin/env node

/**
 * Enterprise SBOM Generator for Meqenet.et
 * Generates CycloneDX SBOMs from package.json files
 * Compliant with Executive Order 14028 requirements
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function readJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to read ${filePath}: ${error.message}`);
    return null;
  }
}

function getPackageInfo(packagePath) {
  const packageJson = readJson(path.join(packagePath, 'package.json'));
  if (!packageJson) return null;

  return {
    name: packageJson.name || path.basename(packagePath),
    version: packageJson.version || '0.1.0',
    description: packageJson.description || '',
    license: packageJson.license || 'UNLICENSED',
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
    engines: packageJson.engines || {},
  };
}

function generateComponent(component, type = 'library') {
  const purl = `pkg:npm/${component.name}@${component.version}`;
  const bomRef = purl;

  return {
    'bom-ref': bomRef,
    type: type,
    name: component.name,
    version: component.version,
    description: component.description,
    purl: purl,
    externalReferences: [
      {
        type: 'website',
        url: `https://www.npmjs.com/package/${component.name}`,
      },
    ],
  };
}

function generateSBOM(packagePath, outputFile) {
  const packageInfo = getPackageInfo(packagePath);
  if (!packageInfo) {
    console.error(`❌ Could not read package info from ${packagePath}`);
    return false;
  }

  console.log(`🔍 Analyzing ${packageInfo.name} v${packageInfo.version}`);

  const components = [];
  const dependencies = [];

  // Add main component
  const mainComponent = {
    'bom-ref': `pkg:npm/${packageInfo.name}@${packageInfo.version}`,
    type: 'application',
    name: packageInfo.name,
    version: packageInfo.version,
    description: packageInfo.description,
    purl: `pkg:npm/${packageInfo.name}@${packageInfo.version}`,
    licenses:
      packageInfo.license !== 'UNLICENSED'
        ? [{ license: { id: packageInfo.license } }]
        : [],
    externalReferences: [
      {
        type: 'vcs',
        url: 'https://github.com/meqenet-et/meqenet.git',
      },
    ],
  };

  // Process dependencies
  const allDeps = {
    ...packageInfo.dependencies,
    ...packageInfo.devDependencies,
  };

  for (const [name, version] of Object.entries(allDeps)) {
    // Clean version (remove ^, ~, etc.)
    const cleanVersion = version.replace(/^[^\d]*/, '');

    const component = {
      name,
      version: cleanVersion,
      description: `${name} package`,
      purl: `pkg:npm/${name}@${cleanVersion}`,
    };

    components.push(generateComponent(component));

    // Add dependency relationship
    dependencies.push({
      ref: mainComponent['bom-ref'],
      dependsOn: [`pkg:npm/${name}@${cleanVersion}`],
    });
  }

  // Generate SBOM
  const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      authors: [{ name: 'Meqenet.et Financial Services' }],
      lifecycles: [{ phase: 'build' }],
      tools: {
        components: [
          {
            group: '@meqenet',
            name: 'enterprise-sbom-generator',
            version: '1.0.0',
            type: 'application',
            'bom-ref': 'pkg:generic/@meqenet/enterprise-sbom-generator@1.0.0',
          },
        ],
      },
      component: mainComponent,
    },
    components,
    dependencies,
  };

  // Write SBOM
  fs.writeFileSync(outputFile, JSON.stringify(sbom, null, 2));
  console.log(`✅ SBOM generated: ${outputFile}`);
  console.log(`📊 Components: ${components.length}`);
  console.log(`📊 Dependencies: ${dependencies.length}`);

  return true;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      'Usage: node scripts/generate-sbom.js <package-path> <output-file>'
    );
    console.error(
      'Example: node scripts/generate-sbom.js backend/services/api-gateway bom.api-gateway.json'
    );
    process.exit(1);
  }

  const packagePath = args[0];
  const outputFile = args[1];

  if (!fs.existsSync(packagePath)) {
    console.error(`❌ Package path does not exist: ${packagePath}`);
    process.exit(1);
  }

  const success = generateSBOM(packagePath, outputFile);
  process.exit(success ? 0 : 1);
}

// ES Module equivalent of require.main === module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateSBOM };
