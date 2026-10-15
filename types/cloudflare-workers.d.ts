interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface D1Database {
  [key: string]: unknown;
}

declare module "cloudflare:workers" {
  /** Cloudflare bindings are provided by the runtime in worker deployments. */
  export const env: {
    DB?: D1Database;
    [key: string]: unknown;
  };
}
