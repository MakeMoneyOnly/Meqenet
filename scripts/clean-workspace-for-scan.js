#!/usr/bin/env node

/**
 * Clean workspace for OWASP scanning
 * Removes duplicate node_modules and prepares clean package structure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning workspace for OWASP scan...');

// Clean frontend node_modules to prevent duplicates
const frontendDirs = ['frontend/apps/app', 'frontend/apps/website'];

frontendDirs.forEach(dir => {
  const nodeModulesPath = path.join(dir, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log(`Removing ${nodeModulesPath}...`);
    try {
      execSync(`rmdir /s /q "${nodeModulesPath}"`, { stdio: 'inherit' });
    } catch (error) {
      console.log(`Could not remove ${nodeModulesPath}:`, error.message);
    }
  }
});

// Clean backend services node_modules to prevent duplicates
const backendServices = [
  'backend/services/auth-service',
  'backend/services/api-gateway',
];

backendServices.forEach(service => {
  const nodeModulesPath = path.join(service, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log(`Removing ${nodeModulesPath}...`);
    try {
      execSync(`rmdir /s /q "${nodeModulesPath}"`, { stdio: 'inherit' });
    } catch (error) {
      console.log(`Could not remove ${nodeModulesPath}:`, error.message);
    }
  }
});

console.log('✅ Workspace cleaned for OWASP scanning');
