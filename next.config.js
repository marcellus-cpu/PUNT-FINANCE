/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.alphavantage.co",
      },
    ],
    dangerouslyAllowSVG: false,
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

module.exports = nextConfig;
