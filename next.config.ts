import type {NextConfig} from 'next';

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/SemperScribe' : '';

console.log(`[NextConfig] Environment: ${process.env.NODE_ENV}`);
console.log(`[NextConfig] BasePath: '${basePath}'`);

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: isProd ? '/SemperScribe/' : undefined,
  output: isProd ? 'export' : undefined,
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true, 
  },
};

export default nextConfig;
