import { redisCommand } from '../../lib/upstash.js';

function jsonResponse(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  try {
    const id = (req.query.id || '').toString();
    if (!id) return jsonResponse(res, 400, { error: 'id required' });

    const pollKey = `poll:${id}`;
    const raw = await redisCommand(['HGETALL', pollKey]);
    const counts = {};
    if (Array.isArray(raw)) {
      for (let i = 0; i < raw.length; i += 2) {
        counts[raw[i]] = Number(raw[i + 1] || 0);
      }
    } else if (raw && typeof raw === 'object') {
      for (const k of Object.keys(raw)) counts[k] = Number(raw[k] || 0);
    }
    return jsonResponse(res, 200, { id, counts });
  } catch (err) {
    console.error('results error', err?.message || err);
    return jsonResponse(res, 503, { error: 'Service unavailable' });
  }
}
