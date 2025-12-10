import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

const OPTIONS = ['Lanjut Ronda', 'Stop Ronda'];
const POLL_ID = process.env.NEXT_PUBLIC_POLL_ID || 'ronda';

function getCookie(name) {
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[2]) : null;
}

export default function Vote() {
  const [phone, setPhone] = useState(null);
  const [choice, setChoice] = useState(OPTIONS[0]);
  const [status, setStatus] = useState('');
  const [already, setAlready] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const canvasRef = useRef(null);
  const router = useRouter();
  const apiRef = useRef(null);

  useEffect(() => {
    const p = getCookie('phone');
    if (!p) {
      router.push('/');
      return;
    }
    setPhone(p);

    // Check voting state from centralized API
    fetch(`/api/check?id=${encodeURIComponent(POLL_ID)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j && j.already) setAlready(true);
      })
      .catch(() => {});
  }, []);

  // Fireworks engine
  useEffect(() => {
    let raf;
    let particles = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function random(min, max) {
      return Math.random() * (max - min) + min;
    }

    function spawnFirework() {
      const cx = random(canvas.width * 0.2, canvas.width * 0.8);
      const cy = random(canvas.height * 0.1, canvas.height * 0.6);
      const count = 35 + Math.round(random(0, 40));
      const hue = Math.round(random(0, 360));
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60 + Math.round(Math.random() * 40),
          age: 0,
          color: `hsl(${hue} ${60 + Math.random() * 40}% 50%)`,
          size: 1 + Math.random() * 2.4,
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.02;
        p.x += p.vx;
        p.y += p.vy;
        p.age++;
        const alpha = Math.max(0, 1 - p.age / p.life);
        if (alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    frame();

    apiRef.current = {
      burst: spawnFirework,
      cleanup: () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
      },
    };

    return () => {
      apiRef.current && apiRef.current.cleanup();
    };
  }, []);

  function doBursts(count = 8) {
    const api = apiRef.current;
    if (!api || !api.burst) return;
    for (let i = 0; i < count; i++) {
      setTimeout(() => api.burst(), i * 220);
    }
  }

  async function onVote(e) {
    e.preventDefault();
    setStatus('');
    setBusy(true);
    try {
      const payload = { id: POLL_ID, option: choice };
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) {
        if (res.status === 409) setStatus('Anda sudah memberikan suara sebelumnya.');
        else if (res.status === 401) setStatus('Autentikasi hilang. Silakan login lagi.');
        else setStatus(j.error || 'Gagal submit');
        setBusy(false);
        return;
      }

      setAlready(true);
      setStatus('Vote berhasil — terima kasih!');
      setShowThanks(true);
      doBursts(8);
      setTimeout(() => setShowThanks(false), 6000);
      setBusy(false);
    } catch (err) {
      setStatus('Koneksi error');
      setBusy(false);
    }
  }

  return (
    <div>
      <canvas ref={canvasRef} className="fireworks-canvas" aria-hidden="true" />
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="header" role="banner">
          <img src="/logo.png" alt="Guyub Rukun - The Youth Long Cafe" className="logo" />
          <div className="header-overlay" aria-hidden="true" />
          <h1>Voting Ronda RT01</h1>
        </div>

        <div style={{ height: 12 }} />

        <div className="card" role="main">
          <h3>Selamat datang</h3>
          <p className="small">Nomor: {phone || '—'}</p>

          {already ? (
            <div>
              <div className="notice">Anda sudah memberikan suara. Terima kasih.</div>
              <div style={{ marginTop: 12 }}>
                <a href="/public" className="btn" style={{ background: '#111827' }}>
                  Lihat Hasil Publik
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={onVote}>
              <p className="small">
                Demi Kebaikan RT kita silakan pilih sesuai keinginan panjenengan. di jamin aman!!!
              </p>
              <select className="select" value={choice} onChange={(e) => setChoice(e.target.value)}>
                {OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn" disabled={busy}>
                  {busy ? 'Mengirim...' : 'Kirim Vote'}
                </button>
                <a href="/public" className="small center" style={{ alignItems: 'center', padding: '10px' }}>
                  Lihat hasil publik
                </a>
              </div>
              {status && <div className="notice" style={{ marginTop: 12 }}>{status}</div>}
            </form>
          )}

          <div style={{ marginTop: 12 }}>
            <small>Nomor HP disimpan di cookie. Vote disimpan di Redis (Upstash).</small>
          </div>
        </div>
      </div>

      {showThanks && (
        <div
          className="thanks-overlay"
          role="status"
          aria-live="polite"
          onClick={() => setShowThanks(false)}
        >
          <div className="thanks-card">
            <h2>Terimakasih telah ikut Vote</h2>
            <p>Salam The youth longcafe</p>
            <button className="btn" onClick={() => setShowThanks(false)} style={{ marginTop: 10 }}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
