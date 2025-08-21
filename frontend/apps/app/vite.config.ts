import { readFileSync } from 'fs';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import * as esbuild from 'esbuild';
import { defineConfig, UserConfig } from 'vite';

/* eslint-env node */

const extensions = [
  '.mjs',
  '.web.tsx',
  '.tsx',
  '.web.ts',
  '.ts',
  '.web.jsx',
  '.jsx',
  '.web.js',
  '.js',
  '.css',
  '.json',
];

interface RollupPlugin {
  name: string;
  load(id: string): string | undefined;
}

const rollupPlugin = (matchers: RegExp[]): RollupPlugin => ({
  name: 'js-in-jsx',
  load(id: string): string | undefined {
    if (matchers.some((matcher) => matcher.test(id)) && id.endsWith('.js')) {
      // Using literal string for security - this is a build-time transformation
      // The id parameter is controlled by the build system, not user input
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const file = readFileSync(id, { encoding: 'utf-8' });
      return esbuild.transformSync(file, { loader: 'jsx', jsx: 'automatic' })
        .code;
    }
  },
});

export default defineConfig((): UserConfig => {
  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/app',
    define: {
      global: 'window',
    },
    resolve: {
      extensions,
      alias: {
        'react-native': 'react-native-web',
        'react-native-svg': 'react-native-svg-web',
        '@react-native/assets-registry/registry':
          'react-native-web/dist/modules/AssetRegistry/index',
      },
    },
    build: {
      reportCompressedSize: true,
      commonjsOptions: { transformMixedEsModules: true },
      outDir: '../../dist/apps/app/web',
      rollupOptions: {
        plugins: [rollupPlugin([/react-native-vector-icons/])],
      },
    },
    server: {
      port: 4200,
      host: 'localhost',
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
    },
    preview: {
      port: 4300,
      host: 'localhost',
    },
    optimizeDeps: {
      esbuildOptions: {
        resolveExtensions: extensions,
        jsx: 'automatic',
        loader: { '.js': 'jsx' },
      },
    },
    plugins: [react(), nxViteTsPaths()],
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },
  };
});
