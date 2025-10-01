import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    allowedHosts: [
      'devserver-dev--critique-videoludique.netlify.app'
    ]
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'html'],
      all: true,
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.snap']
    },
    include: ['src/**/__tests__/**/*.{test,spec}.{js,ts}', '__tests__/**/*.{test,spec}.{js,ts}'],
    exclude: ['__tests__/__snapshots__/**/*']
  }
})
