// Polyfill Promise.withResolvers for Node.js < 22
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

export async function register() {
  // Instrumentation hook - polyfill is applied above at module load time
}
