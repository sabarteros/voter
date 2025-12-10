import { getAllowedPhones } from '../../lib/allowed';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { phone } = req.body || {};
  if (!phone || typeof phone !== 'string') return res.status(400).json({ error: 'Phone required' });

  try {
    const normalized = phone.replace(/\s|[-+()]/g, '').replace(/[^\d]/g, '');
    const allowed = await getAllowedPhones();
    if (!allowed || allowed.length === 0) {
      console.error('Login attempted but allowed list is empty');
      return res.status(500).json({ error: 'No allowed phone configuration' });
    }
    if (!allowed.includes(normalized)) {
      return res.status(401).json({ error: 'Phone not allowed' });
    }

    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const sameSite = 'Lax';
    const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const cookie = `phone=${encodeURIComponent(normalized)}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secureFlag}`;
    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({ ok: true, phone: normalized });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Server error' });
  }
}
