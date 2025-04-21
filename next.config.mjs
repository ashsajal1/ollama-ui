/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost'],
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'img.clerk.com',
            port: '',
            pathname: '/*',
          },
        ],
    },
};

export default nextConfig;
