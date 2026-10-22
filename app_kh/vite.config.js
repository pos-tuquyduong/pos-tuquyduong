import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: App KH chạy ở 5174, /api chuyển sang máy chủ POS (3001). Production: máy chủ POS phục vụ app_kh/dist theo KH_HOST.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } } },
})
