#!/usr/bin/env node

/**
 * Script to deduplicate dependencies in CycloneDX SBOM files
 * Fixes validation issues caused by duplicate entries in dependsOn arrays
 */

const fs = require('fs');

function deduplicateArray(arr) {
  return [...new Set(arr)];
}

function deduplicateSBOM(filePath) {
  try {
    console.log(`Processing ${filePath}...`);

    const sbomContent = fs.readFileSync(filePath, 'utf8');
    const sbom = JSON.parse(sbomContent);

    let modificationsCount = 0;

    // Deduplicate dependencies if they exist
    if (sbom.dependencies && Array.isArray(sbom.dependencies)) {
      sbom.dependencies.forEach((dependency, index) => {
        if (dependency.dependsOn && Array.isArray(dependency.dependsOn)) {
          const originalLength = dependency.dependsOn.length;
          dependency.dependsOn = deduplicateArray(dependency.dependsOn);
          const newLength = dependency.dependsOn.length;

          if (originalLength !== newLength) {
            modificationsCount += originalLength - newLength;
            console.log(
              `  Dependency ${index} (${dependency.ref}): Removed ${originalLength - newLength} duplicates`
            );
          }
        }
      });
    }

    // Also check components for dependsOn arrays (if they exist)
    if (sbom.components && Array.isArray(sbom.components)) {
      sbom.components.forEach((component, index) => {
        if (component.dependsOn && Array.isArray(component.dependsOn)) {
          const originalLength = component.dependsOn.length;
          component.dependsOn = deduplicateArray(component.dependsOn);
          const newLength = component.dependsOn.length;

          if (originalLength !== newLength) {
            modificationsCount += originalLength - newLength;
            console.log(
              `  Component ${index} (${component['bom-ref'] || component.name}): Removed ${originalLength - newLength} duplicates`
            );
          }
        }
      });
    }

    // Write the deduplicated SBOM back to file
    fs.writeFileSync(filePath, JSON.stringify(sbom, null, 2));

    if (modificationsCount > 0) {
      console.log(
        `✅ ${filePath}: Removed ${modificationsCount} duplicate entries`
      );
    } else {
      console.log(`✅ ${filePath}: No duplicates found`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(
      'Usage: node deduplicate-sbom.js <sbom-file1> [sbom-file2] ...'
    );
    console.log('');
    console.log(
      'Example: node deduplicate-sbom.js bom.api-gateway.json bom.auth-service.json'
    );
    process.exit(1);
  }

  let allSuccessful = true;

  for (const filePath of args) {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      allSuccessful = false;
      continue;
    }

    const success = deduplicateSBOM(filePath);
    if (!success) {
      allSuccessful = false;
    }
  }

  if (allSuccessful) {
    console.log('\n🎉 All SBOM files processed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Some files failed to process');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { deduplicateSBOM, deduplicateArray };
