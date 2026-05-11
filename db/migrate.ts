import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "migrations");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Source /etc/tur-sjef/env or set it in .env.local.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { onnotice: () => {} });

await sql`CREATE TABLE IF NOT EXISTS _migration (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

const applied = new Set(
  (await sql<{ name: string }[]>`SELECT name FROM _migration`).map((r) => r.name),
);

const files = (await readdir(migrationsDir))
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  if (applied.has(file)) {
    console.log(`✓ ${file} (already applied)`);
    continue;
  }
  console.log(`→ applying ${file}`);
  const body = await readFile(join(migrationsDir, file), "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(body);
    await tx`INSERT INTO _migration (name) VALUES (${file})`;
  });
  console.log(`✓ ${file}`);
}

await sql.end();
console.log("migrations done");
