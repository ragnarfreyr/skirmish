import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/skirmish/',
  plugins: [react()],
  // The 3D dice engine is big, but it loads on its own after the game is up.
  build: { chunkSizeWarningLimit: 2000 },
})
