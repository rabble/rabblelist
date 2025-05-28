import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [// Temporarily disabled - we're using a custom service worker
  // VitePWA({
  //   registerType: 'autoUpdate',
  //   strategies: 'injectManifest',
  //   srcDir: 'public',
  //   filename: 'sw.js',
  //   includeAssets: ['robots.txt', '.well-known/*', 'icon-*.png'],
  //   manifest: false, // Using external manifest.json
  //   injectManifest: {
  //     globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
  //   },
  //   devOptions: {
  //     enabled: true
  //   }
  // })
  react(), sentryVitePlugin({
    org: "protestnet",
    project: "javascript-react"
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    },

    sourcemap: true
  }
})