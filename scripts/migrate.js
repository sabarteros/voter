// Migrate local votes JSON (flat or nested) into Upstash
// Usage: UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node scripts/migrate.js ./data/votes.json
import fs from 'fs';
import path from 'path';
import { redisCommand } from '../lib/upstash.js';

async function migrateFlat(obj) {
  for (const [rawKey, val] of Object.entries(obj)) {
    const count = Number(val) || 0;
    if (count === 0) continue;
    const key = rawKey.startsWith('vote:') ? rawKey : `vote:${rawKey}`;
    console.log('INCRBY', key, count);
    await redisCommand(['INCRBY', key, String(count)]);
  }
}

async function migrateNested(obj) {
  for (const [id, options] of Object.entries(obj)) {
    for (const [opt, val] of Object.entries(options || {})) {
      const count = Number(val) || 0;
      if (count === 0) continue;
      const key = `poll:${id}`;
      console.log('HINCRBY', key, opt, count);
      await redisCommand(['HINCRBY', key, opt, String(count)]);
    }
  }
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Provide path to JSON file: node scripts/migrate.js ./old_votes.json');
    process.exit(1);
  }
  const full = path.resolve(file);
  if (!fs.existsSync(full)) {
    console.error('File not found:', full);
    process.exit(1);
  }
  const raw = fs.readFileSync(full, 'utf8');
  const obj = JSON.parse(raw);

  if (Object.values(obj).every((v) => typeof v === 'number' || typeof v === 'string')) {
    await migrateFlat(obj);
  } else {
    await migrateNested(obj);
  }
  console.log('Migration finished');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
