import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Added explicit import for process from node:process to resolve TypeScript errors regarding 'cwd'
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env vars instead of just ones starting with `VITE_`.
  /** Fix: Cast process as any to resolve "Property 'cwd' does not exist on type 'Process'" error in restricted environments */
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Bridges institutional environment variables for the Gemini SDK and Supabase Interface
      // Supports both naked and VITE_ prefixed versions to prevent "required" injection errors
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GEMINI_API_KEY || ""),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || env.VITE_SUPABASE_URL || ""),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "")
    },
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});