import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/stock': 'http://localhost:3000',
      '/leetify': 'http://localhost:3000',
      '/steam' : 'http://localhost:3000',
    }
  }
})