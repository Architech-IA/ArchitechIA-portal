import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/pipeline', destination: '/leads', permanent: true },
      { source: '/cuentas', destination: '/resources/cuentas', permanent: true },
    ];
  },
};

export default nextConfig;
