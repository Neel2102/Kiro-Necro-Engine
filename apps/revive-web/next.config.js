/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@necro/common', '@necro/scanner', '@necro/planner', '@necro/reporter'],
};

export default nextConfig;
