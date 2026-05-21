import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '/etc/secrets/',
  server: {
    proxy: {
      '/api': {
        target: 'https://mine_detector.onrender.com',
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
    hmr: {
      clientPort: 443,
    },
  },
  build: {
	rolldownOptions: {
		input: {
			main: "main.js",
			game: "game.js",
			index: "index.html",
			style: "style.css"
		},
		output: {
			assetFileNames: (assetInfo) => {
				console.log(assetInfo)
				// const names = assetInfo.names.split("/");
				// return `assets/${names[names.length-1]}`;
				return 'assets/[name].[ext]'
			},
			entryFileNames: (fileInfo) => {
				console.log(fileInfo);
				return "assets/[name].js"
			},
			chunkFileNames: (fileInfo) => {
				console.log(fileInfo);
				return "assets/[name].js"
			}
		}
	}
  }
});
