const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const fs = require('fs');

// Check if assets directory exists
const assetsPath = './src/assets';
const assets = fs.existsSync(assetsPath) ? [assetsPath] : [];

module.exports = {
  output: {
    path: join(__dirname, '../../../dist/backend/services/auth-service'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: assets,
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
    }),
  ],
};
