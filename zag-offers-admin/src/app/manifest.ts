import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zag Offers Admin',
    short_name: 'Zag Admin',
    description: 'لوحة الإدارة المركزية لمنصة Zag Offers',
    start_url: '/dashboard',
    id: '/dashboard',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    background_color: '#071426',
    theme_color: '#FF6B00',
    orientation: 'any',
    dir: 'rtl',
    lang: 'ar',
    icons: [
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}
