import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app"],
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101"}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
