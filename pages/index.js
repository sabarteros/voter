import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const router = useRouter();

  async function onLogin(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ phone })
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error || 'Login failed');
        setLoading(false);
        return;
      }
      router.push('/vote');
    } catch (e) {
      setErr('Network error');
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="container">
        <div className="header">
          <div className="header-overlay" />
          <h1>Voting Ronda</h1>
        </div>

        <div style={{height:12}} />

        <div className="card">
          <h3>Login</h3>
          <p className="small">Masukkan nomor HP yang telah didaftarkan.</p>
          <form onSubmit={onLogin} className="form-row" style={{flexDirection:'column', alignItems:'stretch'}}>
            <input className="input" placeholder="Contoh: 081234567890" value={phone} onChange={(e)=>setPhone(e.target.value)} />
            <div style={{display:'flex', gap:8, marginTop:8}}>
              <button className="btn" disabled={loading}>{loading ? 'Memeriksa...' : 'Login'}</button>
              <a href="/public" className="small center" style={{alignItems:'center', padding:'10px'}}>Lihat hasil publik</a>
            </div>
            {err && <div className="notice">{err}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
