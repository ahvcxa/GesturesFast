import { defineConfig, build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        react(),
        {
            name: 'build-content-script-iife',
            apply: 'build',
            async closeBundle() {
                await build({
                    configFile: false,
                    publicDir: false,
                    build: {
                        outDir: 'dist',
                        emptyOutDir: false,
                        lib: {
                            entry: resolve(__dirname, 'src/extension/content_scripts/content.ts'),
                            name: 'GesturesFastContent',
                            formats: ['iife'],
                            fileName: () => 'content.js'
                        },
                        rollupOptions: {
                            output: {
                                extend: true
                            }
                        }
                    }
                });
            }
        }
    ],
    // Chrome extensions load via chrome-extension://<id>/ — there is no web server,
    // so asset paths in HTML must be relative ('./options.js') not absolute ('/options.js').
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true, // Clean the output directory before each build
        rollupOptions: {
            // Options UI and Background Service Worker (ES module)
            input: {
                options: resolve(__dirname, 'options.html'),
                background: resolve(__dirname, 'src/extension/background/background.ts')
            },
            output: {
                // Manifest requires stable file names (e.g. background.js)
                entryFileNames: '[name].js',
                chunkFileNames: '[name].[hash].js',
                assetFileNames: '[name].[ext]'
            }
        }
    }
});