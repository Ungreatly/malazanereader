import path from 'node:path';
import vinext from 'vinext';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vinext()],
  resolve: {
    alias: {
      // Updated to point to the installed node_modules package instead of the empty public folder
      '@pdfjs': path.resolve(__dirname, 'node_modules/pdfjs-dist/build'),
      '@simplecc': path.resolve('public/vendor/simplecc'),
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (warning.message?.includes("Can't resolve original location of error")) return;
        defaultHandler(warning);
      },
    },
  },
  ssr: {
    noExternal: ['tinycolor2'],
  },
});
