import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Generamos un timestamp (marca de tiempo) único al momento exacto de la compilación
const timestamp = new Date().getTime();

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Dentalix',
        short_name: 'Dentalix',
        description: 'Sistema de Gestión Clínica',
        theme_color: '#FFFFFF', /* Cambiado a blanco para que la barra se camufle bien */
        background_color: '#FFFFFF',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'apple-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // =========================================================================
  // LA RULETA RUSA DE VITE: MUTACIÓN FORZADA DE ARCHIVOS
  // =========================================================================
  build: {
    rollupOptions: {
      output: {
        // Obligamos a Vite a inyectar el timestamp en el nombre de TODOS los archivos.
        // Resultado ej: Citas-CFPoYj4F-1715428901.js (Imposible de cachear)
        entryFileNames: `assets/[name]-[hash]-${timestamp}.js`,
        chunkFileNames: `assets/[name]-[hash]-${timestamp}.js`,
        assetFileNames: `assets/[name]-[hash]-${timestamp}.[ext]`,
      }
    }
  }
})