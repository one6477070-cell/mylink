import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

/** 홈 화면에 설치(PWA)할 때 쓰는 정보. 서비스 워커와 푸시 알림은 4단계에서 붙인다 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: '/map',
    scope: '/',
    display: 'standalone',
    background_color: '#1e1e20',
    theme_color: '#1e1e20',
    lang: 'ko',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
