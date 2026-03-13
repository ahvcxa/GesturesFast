import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        emptyOutDir: true, // Clean the output directory before each build
        rollupOptions: {
            // 3 separate entry points: Options UI, Background Service Worker, Content Script
            input: {
                options: resolve(__dirname, 'options.html'),
                background: resolve(__dirname, 'src/extension/background/background.ts'),
                content: resolve(__dirname, 'src/extension/content_scripts/content.ts')
            },
            output: {
                // Manifest requires stable file names (e.g. background.js, content.js)
                entryFileNames: '[name].js',
                chunkFileNames: '[name].[hash].js',
                assetFileNames: '[name].[ext]'
            }
        }
    }
});