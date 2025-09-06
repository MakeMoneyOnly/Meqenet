#!/usr/bin/env node

/**
 * SBOM Deduplication Script for Meqenet.et
 * Merges multiple CycloneDX SBOMs and removes duplicate dependencies
 */

import fs from 'fs';

function readJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to read ${filePath}: ${error.message}`);
    return null;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function mergeSBOMs(sboms) {
  if (!sboms || sboms.length === 0) {
    throw new Error('No SBOMs provided for merging');
  }

  // Start with the first SBOM as the base
  const merged = JSON.parse(JSON.stringify(sboms[0]));

  // Track unique components by bom-ref
  const componentMap = new Map();
  const dependencyMap = new Map();

  // Index all components from the base SBOM
  if (merged.components) {
    for (const component of merged.components) {
      const key = component['bom-ref'] || component.name;
      componentMap.set(key, component);
    }
  }

  // Index dependencies from the base SBOM
  if (merged.dependencies) {
    for (const dep of merged.dependencies) {
      dependencyMap.set(dep.ref, dep);
    }
  }

  // Merge additional SBOMs
  for (let i = 1; i < sboms.length; i++) {
    const sbom = sboms[i];

    // Merge components
    if (sbom.components) {
      for (const component of sbom.components) {
        const key = component['bom-ref'] || component.name;
        if (!componentMap.has(key)) {
          componentMap.set(key, component);
        }
      }
    }

    // Merge dependencies
    if (sbom.dependencies) {
      for (const dep of sbom.dependencies) {
        if (!dependencyMap.has(dep.ref)) {
          dependencyMap.set(dep.ref, dep);
        } else {
          // Merge dependsOn arrays if they exist
          const existing = dependencyMap.get(dep.ref);
          if (dep.dependsOn && existing.dependsOn) {
            const combined = [
              ...new Set([...existing.dependsOn, ...dep.dependsOn]),
            ];
            existing.dependsOn = combined;
          }
        }
      }
    }

    // Merge other metadata if needed
    if (sbom.metadata && sbom.metadata.tools) {
      if (!merged.metadata) merged.metadata = {};
      if (!merged.metadata.tools) merged.metadata.tools = { components: [] };
      if (!merged.metadata.tools.components)
        merged.metadata.tools.components = [];

      // Add unique tools
      const toolMap = new Map();
      for (const tool of merged.metadata.tools.components) {
        toolMap.set(tool.name, tool);
      }
      for (const tool of sbom.metadata.tools.components || []) {
        if (!toolMap.has(tool.name)) {
          toolMap.set(tool.name, tool);
          merged.metadata.tools.components.push(tool);
        }
      }
    }
  }

  // Update merged SBOM with deduplicated components and dependencies
  merged.components = Array.from(componentMap.values());
  merged.dependencies = Array.from(dependencyMap.values());

  // Update metadata
  merged.metadata.timestamp = new Date().toISOString();

  return merged;
}

function main() {
  const args = process.argv.slice(2);
  const outputFile =
    args.find(arg => arg.startsWith('--output='))?.split('=')[1] ||
    'bom.merged.json';
  const inputFiles = args.filter(arg => !arg.startsWith('--'));

  if (inputFiles.length === 0) {
    console.error(
      'Usage: node scripts/deduplicate-sbom.js [--output=file.json] bom1.json bom2.json ...'
    );
    process.exit(1);
  }

  console.log('🔄 Merging SBOMs...');

  const sboms = [];
  for (const file of inputFiles) {
    const sbom = readJson(file);
    if (sbom) {
      sboms.push(sbom);
      console.log(`✅ Loaded ${file}`);
    } else {
      console.error(`❌ Failed to load ${file}`);
      process.exit(1);
    }
  }

  try {
    const merged = mergeSBOMs(sboms);
    writeJson(outputFile, merged);
    console.log(`✅ Merged SBOM saved to ${outputFile}`);
    console.log(`📊 Components: ${merged.components?.length || 0}`);
    console.log(`📊 Dependencies: ${merged.dependencies?.length || 0}`);
  } catch (error) {
    console.error(`❌ Merge failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { mergeSBOMs };
