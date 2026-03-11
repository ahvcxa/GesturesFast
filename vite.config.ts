// Dosya: vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        emptyOutDir: true, // Her derlemede eski dosyaları temizle
        rollupOptions: {
            // 3 farklı giriş noktamız var (Options UI, Background, Content Script)
            input: {
                options: resolve(__dirname, 'src/extension/ui/options.html'),
                background: resolve(__dirname, 'src/extension/background/background.ts'),
                content: resolve(__dirname, 'src/extension/content_scripts/content.ts')
            },
            output: {
                // Manifest dosyamız isimlerin sabit kalmasını bekler (örn: background.js)
                entryFileNames: '[name].js',
                chunkFileNames: '[name].[hash].js',
                assetFileNames: '[name].[ext]'
            }
        }
    }
});