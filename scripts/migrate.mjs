import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import net from "node:net";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[EduOS migrations] DATABASE_URL is required.");
  process.exit(1);
}

function parseDatabaseConfig(rawUrl) {
  if (!rawUrl) return null;
  try {
    const match = rawUrl.match(/^postgres(?:ql)?:\/\/(.+)$/i);
    if (!match) return null;
    const rest = match[1];
    const lastAtIndex = rest.lastIndexOf("@");
    let user = "postgres";
    let password = "";
    let hostAndPath = rest;

    if (lastAtIndex !== -1) {
      const creds = rest.slice(0, lastAtIndex);
      hostAndPath = rest.slice(lastAtIndex + 1);
      const firstColon = creds.indexOf(":");
      if (firstColon === -1) {
        user = decodeURIComponent(creds);
      } else {
        user = decodeURIComponent(creds.slice(0, firstColon));
        const rawPass = creds.slice(firstColon + 1);
        try {
          password = decodeURIComponent(rawPass);
        } catch {
          password = rawPass;
        }
      }
    }

    const dummyUrl = new URL("http://" + hostAndPath);
    const host = dummyUrl.hostname;
    const port = Number(dummyUrl.port) || 5432;
    const database = dummyUrl.pathname.replace(/^\//, "") || "postgres";
    const isLocal = host === "localhost" || host === "127.0.0.1";
    const ssl = isLocal ? false : { rejectUnauthorized: false };

    return { host, port, user, password, database, ssl };
  } catch {
    return null;
  }
}

async function canReachPort(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

async function resolveWorkingConfig(rawUrl) {
  const config = parseDatabaseConfig(rawUrl);
  if (!config) return null;
  if (config.host === "localhost" || config.host === "127.0.0.1") return config;

  const isReachable = await canReachPort(config.host, config.port, 2000);
  if (isReachable) return config;

  const sbMatch = config.host.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
  if (sbMatch) {
    const projectRef = sbMatch[1];
    const poolerCandidates = [
      "aws-0-eu-west-1.pooler.supabase.com",
      "aws-0-eu-central-1.pooler.supabase.com",
      "aws-0-us-east-1.pooler.supabase.com",
      "aws-0-us-west-1.pooler.supabase.com",
      "aws-0-ap-southeast-1.pooler.supabase.com"
    ];
    for (const poolerHost of poolerCandidates) {
      const reachable = await canReachPort(poolerHost, 5432, 1500);
      if (reachable) {
        const poolerUser = config.user.includes(".") ? config.user : `${config.user}.${projectRef}`;
        return {
          ...config,
          host: poolerHost,
          port: 5432,
          user: poolerUser
        };
      }
    }
  }
  return config;
}

const poolConfig = await resolveWorkingConfig(databaseUrl);
if (!poolConfig) {
  console.error("[EduOS migrations] Failed to parse DATABASE_URL.");
  process.exit(1);
}

const migrationsDir = path.resolve("migrations");
const files = (await fs.readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();
const pool = new pg.Pool(poolConfig);

try {
  await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
  const applied = new Set((await pool.query("SELECT version FROM schema_migrations")).rows.map((row) => row.version));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[EduOS migrations] Skipping ${file} (already applied).`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`[EduOS migrations] Applied ${file}.`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  console.log(`[EduOS migrations] Complete. ${files.length} migration file(s) checked.`);
} catch (error) {
  console.error(`[EduOS migrations] Failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
