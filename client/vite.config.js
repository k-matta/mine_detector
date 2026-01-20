import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '/etc/secrets/.env',
  server: {
    proxy: {
      '/api': {
        origin: 'https://mine_detector.onrender.com',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
    hmr: {
      clientPort: 443,
    },
  },
});





