/** @type {import('next').NextConfig} */
const nextConfig = {
  // The deployed API is the default for clean judge clones. Developers can use
  // CAREER_API_URL=http://localhost:8000 while running `make api`.
  async rewrites() {
    const apiUrl = process.env.CAREER_API_URL || "https://career-map-api.onrender.com";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
