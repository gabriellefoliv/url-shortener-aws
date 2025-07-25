import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
        return [
            {
                source: '/:path*',
               
                destination: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/:path*`,
            },
        ];
    },
};

export default nextConfig;
