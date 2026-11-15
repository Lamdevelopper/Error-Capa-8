import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Dos entradas: la tableta común (index.html) y el dispositivo personal (individual.html). */
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5190 },
  build: {
    rollupOptions: {
      input: {
        collective: resolve(__dirname, 'index.html'),
        individual: resolve(__dirname, 'individual.html'),
      },
    },
  },
})
