#!/usr/bin/env node

/**
 * JWT Key Generation Script for Meqenet.et
 *
 * Generates RSA key pair for JWT signing and provides instructions
 * for storing them securely in AWS Secrets Manager.
 *
 * Usage: node scripts/generate-jwt-keys.js [--output-dir ./keys]
 */

import * as jose from 'jose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default output directory
const outputDir = process.argv.includes('--output-dir')
  ? process.argv[process.argv.indexOf('--output-dir') + 1]
  : './jwt-keys';

async function generateKeys() {
  console.log('🔐 Generating RSA key pair for JWT signing...');

  try {
    // Generate RSA key pair
    const { publicKey, privateKey } = await jose.generateKeyPair('RS256', {
      modulusLength: 2048,
    });

    // Export keys to PEM format
    const privateKeyPem = await jose.exportPKCS8(privateKey);
    const publicKeyPem = await jose.exportSPKI(publicKey);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write keys to files
    const privateKeyPath = path.join(outputDir, 'jwt-private-key.pem');
    const publicKeyPath = path.join(outputDir, 'jwt-public-key.pem');

    fs.writeFileSync(privateKeyPath, privateKeyPem);
    fs.writeFileSync(publicKeyPath, publicKeyPem);

    console.log('✅ RSA key pair generated successfully!');
    console.log(`📁 Private key saved to: ${privateKeyPath}`);
    console.log(`📁 Public key saved to: ${publicKeyPath}`);

    // Display instructions for AWS Secrets Manager
    console.log('\n📋 AWS SECRETS MANAGER SETUP INSTRUCTIONS:');
    console.log('==========================================');

    console.log('\n1. Store the private key:');
    console.log(`   aws secretsmanager create-secret \\`);
    console.log(`     --name "prod/meqenet/jwt-private-key" \\`);
    console.log(
      `     --description "JWT Private Key for Meqenet.et Production" \\`
    );
    console.log(
      `     --secret-string "${privateKeyPem.replace(/\n/g, '\\n')}"`
    );

    console.log('\n2. Store the public key:');
    console.log(`   aws secretsmanager create-secret \\`);
    console.log(`     --name "prod/meqenet/jwt-public-key" \\`);
    console.log(
      `     --description "JWT Public Key for Meqenet.et Production" \\`
    );
    console.log(`     --secret-string "${publicKeyPem.replace(/\n/g, '\\n')}"`);

    console.log('\n3. Set environment variables in your deployment:');
    console.log('   NODE_ENV=production');
    console.log('   AWS_REGION=us-east-1  # or your preferred region');

    console.log('\n4. IAM Policy for the application:');
    console.log(`   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "secretsmanager:GetSecretValue"
         ],
         "Resource": [
           "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/meqenet/jwt-private-key-*",
           "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/meqenet/jwt-public-key-*"
         ]
       }
     ]
   }`);

    console.log('\n⚠️  SECURITY WARNINGS:');
    console.log('====================');
    console.log('• Never commit these keys to version control');
    console.log(
      '• Store the private key file securely and delete after uploading to AWS'
    );
    console.log('• Rotate keys regularly (recommended: every 90 days)');
    console.log('• Use AWS KMS for additional encryption if required');

    // Generate fingerprint for verification
    const jwk = await jose.exportJWK(publicKey);
    const kid = `meqenet-signing-key-prod-${Date.now()}`;
    console.log(`\n🔑 Key ID (kid): ${kid}`);
    console.log(`🔑 Public Key Fingerprint: ${jwk.n?.substring(0, 16)}...`);
  } catch (error) {
    console.error('❌ Failed to generate keys:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1].includes('generate-jwt-keys.js')) {
  generateKeys().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export default generateKeys;
