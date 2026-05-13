import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __pg: ReturnType<typeof postgres> | undefined;
}

function init(): ReturnType<typeof postgres> {
  if (global.__pg) return global.__pg;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const client = postgres(url, {
    max: 8,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    types: {
      // Parse NUMERIC (oid 1700) as JS number — we don't store anything where
      // float precision matters, and the default string return blows up calls
      // like `rating.toFixed(1)` on the client.
      numeric: {
        to: 1700,
        from: [1700],
        serialize: (n: number) => String(n),
        parse: (s: string) => Number(s),
      },
    },
  });
  if (process.env.NODE_ENV !== "production") global.__pg = client;
  else global.__pg = client;
  return client;
}

// Lazy proxy so importing this module never throws — only first use does.
// Lets `next build` succeed in environments that don't have DATABASE_URL set
// at module-evaluation time (it's read on first query instead).
const stub = ((...args: unknown[]) =>
  (init() as unknown as (...a: unknown[]) => unknown)(...args)) as unknown as ReturnType<typeof postgres>;

export const sql = new Proxy(stub, {
  get(_target, prop, receiver) {
    const real = init() as unknown as Record<PropertyKey, unknown>;
    const v = real[prop as PropertyKey];
    return typeof v === "function" ? (v as Function).bind(real) : v;
  },
}) as unknown as ReturnType<typeof postgres>;
