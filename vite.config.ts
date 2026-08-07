import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/OtherDoor/',
  plugins: [react()],
  server: {
    host: true,
  },
})
