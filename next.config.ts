import type {NextConfig} from 'next';

// Polyfill Promise.withResolvers for Node.js < 22 (used by react-pdf/pdfjs-dist)
if (typeof Promise.withResolvers === 'undefined') {
  // @ts-expect-error polyfill
  Promise.withResolvers = function <T>() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}

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
    ignoreBuildErrors: true, 
  },
  images: {
    unoptimized: true, 
  },
};

export default nextConfig;
