import path, { dirname } from "path";
import { fileURLToPath } from "url";

/** Correction de __dirname pour les modules ES6 */
const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost"], // Autorise les images locales
    formats: ['image/avif', 'image/webp'], // Optimisation des images
  },
  compiler: {
    removeConsole: true, // Supprime les console.log en production
    minify: true, // Minification du JS pour améliorer la performance
  },
  experimental: {
    optimizeCss: true, // Améliore le rendu CSS
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "app"),
      "@components": path.resolve(__dirname, "app/components"),
      "@public": path.resolve(__dirname, "public"),
      "@lib": path.resolve(__dirname, "lib"),
    };
    return config;
  },
};

export default nextConfig;
