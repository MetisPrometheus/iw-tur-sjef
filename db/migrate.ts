import { readdir, readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

// Force .env.local to win over inherited shell env (the box's systemd profile
// sets DATABASE_URL for kenjaku-bot, which would otherwise leak in here).
function loadDotenv(path: string): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

const here = dirname(fileURLToPath(import.meta.url));
loadDotenv(resolve(here, "..", ".env.local"));
const migrationsDir = join(here, "migrations");

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not set. Source /etc/tur-sjef/env or set it in .env.local.");
    process.exit(1);
  }
  console.log("→ migrating", DATABASE_URL.replace(/:[^:@]+@/, ":***@"));

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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
