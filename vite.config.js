import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server must run on port 3000 to match the registered OAuth2 redirect URL
// (http://localhost:3000/redirect).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
  },
})
