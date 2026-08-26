import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

await initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
};

export default nextConfig;
