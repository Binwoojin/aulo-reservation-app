import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' — 정적 호스팅 어디에 올려도 동작하도록 상대 경로로 빌드한다.
export default defineConfig({
  base: './',
  plugins: [react()],
});
