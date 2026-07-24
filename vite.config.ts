import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import devServer from '@hono/vite-dev-server';
import cloudflareAdapter from '@hono/vite-dev-server/cloudflare';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      devServer({
        adapter: cloudflareAdapter,
        entry: 'server.ts',
        exclude: [/^(?!\/api\/).*/, /.*\.(ts|tsx|js|jsx|css|scss|json)$/, /^\/favicon\.ico$/],
      }),
    ],
    define: {
      __APP_NAME__: JSON.stringify('MT Academy'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('react-player')) return 'video-player';
            if (id.includes('hls.js')) return 'video-hls';
            if (id.includes('dash.js')) return 'video-dash';
            if (id.includes('framer-motion') || id.includes('/motion/')) return 'motion';
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('/react/')) return 'react';
            if (id.includes('lucide-react') || id.includes('sonner')) return 'ui';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
