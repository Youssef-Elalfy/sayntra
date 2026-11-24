import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  // Pin tracing to this app: the repository root has its own package-lock.json.
  outputFileTracingRoot: __dirname,
  async rewrites() {
    // The public portfolio demo has no backend: it answers API calls in the
    // browser, so it must never proxy to a local or unreachable server.
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return [];
    const backend = process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000';
    return [ { source: '/api/:path*', destination: `${backend}/api/:path*` }, { source: '/sanctum/:path*', destination: `${backend}/sanctum/:path*` } ];
  },
  async headers() { return [{ source: '/:path*', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ] }]; },
};
export default config;
