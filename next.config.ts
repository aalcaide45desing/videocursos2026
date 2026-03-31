import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      {
        // MEGA S4 bucket — thumbnails y assets de cursos
        protocol: "https",
        hostname: "*.s4.mega.io",
      },
      {
        // Clerk — avatares de usuarios
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  // Evitar que el bundle del cliente incluya módulos server-only
  serverExternalPackages: ["@neondatabase/serverless"],
};

export default nextConfig;
