/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.bsky.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.bsky.social',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.bsky.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'video.bsky.app',
        pathname: '/**',
      }
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "img-src 'self' https: data: blob:",
              "media-src 'self' https://video.bsky.app https://*.bsky.app https://cdn.bsky.app data: blob:",
              "connect-src 'self' https://video.bsky.app https://*.bsky.app https://cdn.bsky.app",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "frame-src 'self' https:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;