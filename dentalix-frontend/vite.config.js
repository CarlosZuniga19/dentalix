import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

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
  ]
})