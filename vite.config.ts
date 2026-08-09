import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/TheUntitledSelectionGame/',
  plugins: [react()],
  server: {
    host: true,
  },
})
