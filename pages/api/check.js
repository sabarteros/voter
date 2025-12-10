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

export default async function handler(req, res) {
  try {
    const id = (req.query.id || '').toString();
    if (!id) return jsonResponse(res, 400, { error: 'id required' });

    const phone = parsePhoneFromCookie(req.headers.cookie || '');
    if (!phone) return jsonResponse(res, 200, { already: false });

    const votedKey = `voted:${id}:${phone}`;
    const val = await redisCommand(['GET', votedKey]);
    const already = !!val;
    return jsonResponse(res, 200, { already });
  } catch (err) {
    console.error('check error', err?.message || err);
    return jsonResponse(res, 503, { error: 'Service unavailable' });
  }
}
