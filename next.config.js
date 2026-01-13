/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: __dirname,
    },
    reactStrictMode: true,
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
    },
    // Required for @imgly/background-removal to load WASM/Workers correctly
    headers: async () => {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                ],
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: '/api/py/:path*',
                destination: 'http://127.0.0.1:8000/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
