/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* to the FastAPI backend so the frontend can call /api/fit
  // with no CORS and no hardcoded port. Falls back to bundled JSON if the
  // backend isn't running (see lib/api.ts).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
