// https://vitejs.dev/config/


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'


export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
  ],
  server: {
    proxy: {
      '/api/': {
        target: process.env.AWS_API_GATEWAY_HOST,
        changeOrigin: true,
      },
    },
  },
})
