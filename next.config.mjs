/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    typescript: {
        ignoreBuildErrors: true,
    },
    output: 'standalone',
    webpack: (config) => {
        config.module.rules.push({
            test: /\.(ico|png|jpg|jpeg|gif)$/,
            type: 'asset/resource'
        });
        return config;
    },
    experimental: {
        serverActions: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
