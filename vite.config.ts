import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'import.meta.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(env.STRIPE_PUBLIC_KEY || env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51Q2fTJBpXPH1XQeASkXeF2H2q7XRZtCTcEpgiu4q2qGbMhU4z16OLQoJvSoc6gqbnitN2liegQNkcOtvzRQmboiY009C9UfY5m')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
