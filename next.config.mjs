/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    typescript: {
        ignoreBuildErrors: true,
    },
    output: 'standalone',
    experimental: {
        serverActions: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
