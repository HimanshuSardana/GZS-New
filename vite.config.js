import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'url'

// In production builds, all imports of mockApiService and shared/data/* are
// redirected to a single virtual stub module so the real mock data (~100 KB per
// file) never enters the bundle graph.
const MOCK_STUB_ID = '\0vite-mock-stub';

const mockGuardPlugin = () => {
  let resolvedCfg;
  return {
    name: 'vite-plugin-mock-guard',
    // Run before Vite's alias resolver so resolveId sees the raw specifier.
    enforce: 'pre',
    configResolved(config) {
      resolvedCfg = config;
      const useMock =
        config.env.VITE_USE_MOCK === 'true' ||
        process.env.VITE_USE_MOCK === 'true';
      if (useMock && config.mode === 'production') {
        throw new Error(
          '[vite-plugin-mock-guard] VITE_USE_MOCK=true cannot be used with MODE=production. ' +
          'Remove VITE_USE_MOCK from your environment before running `vite build`.',
        );
      }
    },
    resolveId(source) {
      if (resolvedCfg?.mode !== 'production') return null;
      const norm = source.replace(/\\/g, '/');
      if (
        norm.includes('services/mockApiService') ||
        norm.includes('shared/data/')
      ) {
        // Collapse all mock imports to one virtual module so Rollup
        // deduplicates them; no mock chunk is emitted.
        return MOCK_STUB_ID;
      }
      return null;
    },
    load(id) {
      // syntheticNamedExports: true tells Rollup to synthesize any named import
      // as a property lookup on the default export ({}) rather than raising a
      // "not exported" static error. All named imports resolve to undefined at
      // runtime, which is fine because mock fallbacks are never called in prod.
      if (id === MOCK_STUB_ID) {
        return { code: 'export default {};', syntheticNamedExports: true };
      }
      // Belt-and-suspenders: also stub by resolved absolute path.
      if (resolvedCfg?.mode === 'production') {
        const norm = id.replace(/\\/g, '/');
        if (
          norm.includes('/services/mockApiService') ||
          norm.includes('/shared/data/')
        ) {
          return { code: 'export default {};', syntheticNamedExports: true };
        }
      }
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), mockGuardPlugin()],
  server: {
    proxy: {
      // Forwards /api/cms/* to the CMS service (Docker host port 8001).
      // Set VITE_CMS_API_URL=/api/cms in .env.local to activate this proxy.
      '/api/cms': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@store': fileURLToPath(new URL('./src/store', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    // Optimize chunk sizes
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-animation';
          }
          if (id.includes('node_modules/react-icons')) {
            return 'vendor-ui';
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query';
          }
          if (id.includes('node_modules/react-helmet-async')) {
            return 'vendor-forms';
          }
          if (id.includes('node_modules/axios') || id.includes('node_modules/zustand')) {
            return 'vendor-utils';
          }
          // Feature chunks - only for larger features
          if (id.includes('src/features/tournaments')) {
            return 'chunk-tournaments';
          }
          if (id.includes('src/features/community')) {
            return 'chunk-community';
          }
          if (id.includes('src/features/profile')) {
            return 'chunk-profile';
          }
          if (id.includes('src/features/admin')) {
            return 'chunk-admin';
          }
          if (id.includes('src/features/games')) {
            return 'chunk-games';
          }
        },
        // Optimize asset naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          if (/png|jpe?g|gif|svg|webp/.test(extType)) {
            extType = 'images';
          } else if (/woff|woff2|eot|ttf|otf/.test(extType)) {
            extType = 'fonts';
          } else if (extType === 'css') {
            extType = 'css';
          } else {
            extType = 'misc';
          }
          return `assets/${extType}/[name].[hash][extname]`;
        },
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 500,
    // Use esbuild for minification (no additional dependencies needed)
    minify: 'esbuild',
    // Source maps for production debugging (optional, remove in production if size matters)
    sourcemap: false,
    // Target modern browsers for smaller output
    target: 'esnext',
  },
  // Optimization for dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion',
      'axios',
      'zustand',
      'jwt-decode',
    ],
    exclude: ['@tailwindcss/vite'],
  },
})
