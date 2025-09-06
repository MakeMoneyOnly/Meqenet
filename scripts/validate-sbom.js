#!/usr/bin/env node

/**
 * Custom CycloneDX SBOM validator for Meqenet.et
 * - Deduplicates dependency dependsOn arrays in-memory
 * - Validates essential SBOM fields
 * - Optionally writes fixes with --fix
 * - Exits non-zero only on structural/schema issues we cannot fix locally
 */

import fs from 'fs';
import path from 'path';

function readJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return { __error: `Failed to read/parse JSON: ${error.message}` };
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function uniqueArray(arr) {
  return Array.from(new Set(arr));
}

function collectBomRefs(sbom) {
  const refs = new Set();
  const addRef = ref => {
    if (typeof ref === 'string' && ref.trim().length > 0) refs.add(ref);
  };
  if (Array.isArray(sbom.components)) {
    for (const comp of sbom.components) {
      if (comp && typeof comp === 'object') {
        addRef(comp['bom-ref'] || comp.bomRef || comp.ref || comp.name);
      }
    }
  }
  if (Array.isArray(sbom.services)) {
    for (const svc of sbom.services) {
      if (svc && typeof svc === 'object') {
        addRef(svc['bom-ref'] || svc.bomRef || svc.ref || svc.name);
      }
    }
  }
  return refs;
}

function validateAndFixSbom(sbom, options = { fix: false }) {
  const issues = [];
  let modified = false;

  // Basic sanity checks
  if (!sbom || typeof sbom !== 'object') {
    issues.push('SBOM is not a valid JSON object');
    return { ok: false, issues, modified };
  }
  if (sbom.bomFormat && sbom.bomFormat !== 'CycloneDX') {
    issues.push(`Unexpected bomFormat: ${sbom.bomFormat}`);
  }
  if (!sbom.specVersion) {
    issues.push('Missing specVersion');
  }

  // Build set of known bom-ref identifiers
  const knownRefs = collectBomRefs(sbom);

  // Deduplicate dependsOn across dependencies
  if (Array.isArray(sbom.dependencies)) {
    for (let i = 0; i < sbom.dependencies.length; i++) {
      const dep = sbom.dependencies[i];
      if (dep && Array.isArray(dep.dependsOn)) {
        const original = dep.dependsOn;
        const deduped = uniqueArray(original);
        if (deduped.length !== original.length) {
          issues.push(
            `Dependency[${i}] had ${original.length - deduped.length} duplicate dependsOn entries`
          );
          if (options.fix) {
            dep.dependsOn = deduped;
            modified = true;
          }
        }
        // Optionally warn for unknown refs (do not fail)
        for (const ref of deduped) {
          if (typeof ref !== 'string' || ref.length === 0) continue;
          // Many tools use package URL (purl) style; they may not appear as component bom-ref. Warn only.
          if (!knownRefs.has(ref) && !ref.startsWith('pkg:')) {
            issues.push(`Dependency[${i}] dependsOn unknown ref: ${ref}`);
          }
        }
      }
    }
  }

  // Also normalize any stray dependsOn arrays under components/services (non-standard but seen in the wild)
  const normalizeDependsOnIn = (arr, label) => {
    if (!Array.isArray(arr)) return;
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (item && Array.isArray(item.dependsOn)) {
        const original = item.dependsOn;
        const deduped = uniqueArray(original);
        if (deduped.length !== original.length) {
          issues.push(
            `${label}[${i}] had ${original.length - deduped.length} duplicate dependsOn entries (non-standard)`
          );
          if (options.fix) {
            item.dependsOn = deduped;
            modified = true;
          }
        }
      }
    }
  };
  normalizeDependsOnIn(sbom.components, 'Component');
  normalizeDependsOnIn(sbom.services, 'Service');

  // Final verdict: If only duplicates were found, we treat as fixable. Structural issues (missing specVersion, invalid object) cause failure.
  const hasStructuralFailure = issues.some(
    x =>
      x.includes('Missing specVersion') || x.includes('not a valid JSON object')
  );
  const ok = !hasStructuralFailure;
  return { ok, issues, modified };
}

function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const files = args.filter(a => !a.startsWith('-'));

  // If no files specified, try common defaults
  let targets = files;
  if (targets.length === 0) {
    const defaults = ['bom.api-gateway.json', 'bom.auth-service.json'];
    targets = defaults.filter(p => fs.existsSync(p));
  }
  if (targets.length === 0) {
    console.error(
      'No SBOM files specified or found. Usage: node scripts/validate-sbom.js [--fix] <sbom1.json> <sbom2.json> ...'
    );
    process.exit(2);
  }

  let hadFailure = false;

  for (const file of targets) {
    const abs = path.resolve(file);
    console.log(`\nValidating ${abs}`);
    const json = readJson(abs);
    if (json.__error) {
      console.error(`❌ ${file}: ${json.__error}`);
      hadFailure = true;
      continue;
    }
    const result = validateAndFixSbom(json, { fix });
    if (result.issues.length > 0) {
      for (const issue of result.issues) console.log(`- ${issue}`);
    }
    if (result.modified && fix) {
      writeJson(abs, json);
      console.log('✔ Fixes applied');
    }
    if (result.ok) {
      console.log('✅ Validation passed');
    } else {
      console.log('❌ Validation failed');
      hadFailure = true;
    }
  }

  process.exit(hadFailure ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateAndFixSbom };
