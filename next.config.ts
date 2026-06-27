import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/pintr',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/pintr',
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
