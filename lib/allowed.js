import fs from 'fs/promises';
import path from 'path';

function normalize(phone) {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/[^\d]/g, '');
}

/**
 * Get allowed phones from:
 * - process.env.ALLOWED_PHONES (JSON array string or newline/CSV)
 * - fallback to data/allowed.json
 */
export async function getAllowedPhones() {
  const env = process.env.ALLOWED_PHONES;
  if (env && env.trim() !== '') {
    try {
      const parsed = JSON.parse(env);
      if (Array.isArray(parsed)) return parsed.map(normalize).filter(Boolean);
    } catch (e) {
      // fallback to split
    }
    const parts = env.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
    return parts.map(normalize).filter(Boolean);
  }

  try {
    const p = path.join(process.cwd(), 'data', 'allowed.json');
    const txt = await fs.readFile(p, 'utf8');
    const arr = JSON.parse(txt);
    if (Array.isArray(arr)) return arr.map(normalize).filter(Boolean);
  } catch (e) {
    // no fallback
  }
  return [];
}
