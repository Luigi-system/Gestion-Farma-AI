import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // 👈 carga variables del entorno .env o Render

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // necesario para Render
      port: process.env.PORT || 3000, // Render define PORT automáticamente
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // más común apuntar a /src
      },
    },
    build: {
      outDir: 'dist', // carpeta de salida estándar
    },
  };
});
