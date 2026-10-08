import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // In development, `npm start` runs the API on port 3000 next to `npm run dev`.
  server: { proxy: { '/api': 'http://localhost:3000' } },
})
