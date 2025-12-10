import { redisCommand } from '../../lib/upstash.js';

function jsonResponse(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function parsePhoneFromCookie(cookieHeader = '') {
  if (!cookieHeader) return '';
  const m = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('phone='));
  if (!m) return '';
  try { return decodeURIComponent(m.split('=')[1]).replace(/[^\d]/g, ''); } catch { return ''; }
}

function sanitizeSegment(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/[^A-Za-z0-9_\-:.]/g, '_').slice(0, 200);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return jsonResponse(res, 405, { error: 'Method not allowed' });
    }

    let body = req.body || {};
    if (typeof body === 'string' && body.trim()) {
      try { body = JSON.parse(body); } catch (e) { /* ignore */ }
    }

    const { id, option } = body || {};
    if (!id || typeof id !== 'string' || !option || typeof option !== 'string') {
      return jsonResponse(res, 400, { error: 'Invalid payload. Required: id (string), option (string).' });
    }

    const phone = parsePhoneFromCookie(req.headers.cookie || '');
    if (!phone) return jsonResponse(res, 401, { error: 'Phone cookie missing. Please login.' });

    const safeId = sanitizeSegment(id);
    const safeOption = sanitizeSegment(option);
    const votedKey = `voted:${safeId}:${phone}`;

    // Try to SET NX (mark voted). Upstash returns 'OK' or null
    const setRes = await redisCommand(['SET', votedKey, '1', 'NX']);
    if (setRes === null) {
      return jsonResponse(res, 409, { error: 'Already voted' });
    }

    const pollKey = `poll:${safeId}`;
    await redisCommand(['HINCRBY', pollKey, safeOption, '1']);

    // record (non-fatal)
    try {
      const record = JSON.stringify({ phone, option: safeOption, ts: Date.now() });
      await redisCommand(['LPUSH', `${pollKey}:list`, record]);
      await redisCommand(['LTRIM', `${pollKey}:list`, '0', '999']);
    } catch (err) {
      console.warn('Failed to push vote record', err?.message || err);
    }

    // Return counts
    const raw = await redisCommand(['HGETALL', pollKey]);
    const counts = {};
    if (Array.isArray(raw)) {
      for (let i = 0; i < raw.length; i += 2) {
        counts[raw[i]] = Number(raw[i + 1] || 0);
      }
    } else if (raw && typeof raw === 'object') {
      for (const k of Object.keys(raw)) counts[k] = Number(raw[k] || 0);
    }

    return jsonResponse(res, 200, { ok: true, poll: safeId, counts });
  } catch (err) {
    console.error('vote error', err && (err.stack || err.message || err));
    return jsonResponse(res, 503, { error: 'Service unavailable', details: err && err.message });
  }
}
