declare module "cloudflare:workers" {
  export const env: Record<string, any>;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface D1Database {
  readonly __brand?: "D1Database";
}

interface ImportMetaEnv {
  readonly VITE_SIGNAL_RELAY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
