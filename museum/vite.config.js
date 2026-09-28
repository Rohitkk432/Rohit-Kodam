import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// relative base so the build works under any sub-path (e.g. GitHub Pages /Rohit-Kodam/)
export default defineConfig({ plugins: [react()], base: './' })
