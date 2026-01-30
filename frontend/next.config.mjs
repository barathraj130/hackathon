/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.dribbble.com' },
      { protocol: 'https', hostname: 'media0.giphy.com' },
      { protocol: 'https', hostname: 'media1.giphy.com' },
      { protocol: 'https', hostname: 'media2.giphy.com' },
      { protocol: 'https', hostname: 'media3.giphy.com' },
      { protocol: 'https', hostname: 'media4.giphy.com' },
    ],
  },
  optimizeFonts: false,
};

export default nextConfig;
