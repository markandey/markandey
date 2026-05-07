import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@packages/db': path.resolve(__dirname, '../../packages/db/src'),
      '@packages/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@packages/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@apps/camping': path.resolve(__dirname, '../camping/src'),
    },
  },
})
