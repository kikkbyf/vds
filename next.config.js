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
        middlewareClientMaxBodySize: '50mb',
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
    // Rewrites removed in favor of Route Handler Proxy src/app/api/py/[...path]/route.ts
    // to handle timeouts and large bodies better.
};

module.exports = nextConfig;
