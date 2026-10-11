import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { LEGACY_TOPIC_ALIASES, TOPIC_OPTIONS } from "@/lib/topicOptions";

// Lazy-initialize to avoid build-time errors when DATABASE_URL is not set
let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Alias for backwards compat — resolved lazily at call time
export function getDb(): NeonQueryFunction<false, false> {
  return getSql();
}

export async function initDB() {
  const db = getSql();

  await db`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS opinions (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(200),
      age INTEGER,
      location_type VARCHAR(10) NOT NULL,
      location_name VARCHAR(200) NOT NULL,
      topic_id INTEGER REFERENCES topics(id),
      topic_other VARCHAR(200),
      content TEXT NOT NULL,
      evidence_image TEXT,
      is_anonymous BOOLEAN DEFAULT false,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await db`ALTER TABLE opinions ADD COLUMN IF NOT EXISTS evidence_image TEXT`;

  const existingRows = (await db`SELECT id, name FROM topics`) as Array<{ id: number; name: string }>;
  for (const row of existingRows) {
    const canonicalName = LEGACY_TOPIC_ALIASES[row.name] ?? row.name;
    if (row.name !== canonicalName) {
      await db`UPDATE topics SET name = ${canonicalName} WHERE id = ${row.id}`;
    }
  }

  const existingNames = (await db`SELECT name FROM topics`) as Array<{ name: string }>;
  for (const topicName of TOPIC_OPTIONS) {
    const exists = existingNames.some((row) => row.name === topicName);
    if (!exists) {
      await db`INSERT INTO topics (name) VALUES (${topicName}) ON CONFLICT (name) DO NOTHING`;
    }
  }
}
