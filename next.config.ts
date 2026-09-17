import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hrjezxnksafwabpttbnc.supabase.co",
      },
      {
        protocol: "http",
        hostname: "192.168.178.136",
        port: "54321",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
