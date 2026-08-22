import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// 공공데이터포털 BIS/TAGO API CORS 우회용 프록시 (로컬 개발용)
// GitHub Pages 등 정적 호스팅에서는 브라우저 직접 호출로 폴백됨.
const BIS_BASE = 'https://apis.data.go.kr';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '윤하 버스 - 광양시 실시간 버스',
        short_name: '윤하 버스',
        description: '출퇴근 맞춤 실시간 최적 버스 도착 정보',
        lang: 'ko',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#2563eb',
        background_color: '#f8fafc',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    proxy: {
      '/api/bis': {
        target: BIS_BASE,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bis/, ''),
      },
    },
  },
});