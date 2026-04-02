/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@notcast/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
