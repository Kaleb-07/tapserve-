import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    // During dev, Vite can serve both HTML files directly
    // Admin dashboard: http://localhost:5173/
    // Customer ordering: http://localhost:5173/customer.html
  },
})
