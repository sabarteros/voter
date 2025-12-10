import { useEffect, useState } from 'react';
const POLL_ID = process.env.NEXT_PUBLIC_POLL_ID || 'ronda';

export default function PublicPage() {
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [rawCount, setRawCount] = useState(0);

  useEffect(()=>{
    fetch(`/api/results?id=${encodeURIComponent(POLL_ID)}`).then(r=>{
      if (!r.ok) throw new Error('Not found');
      return r.json();
    }).then(data=>{
      const counts = data.counts || {};
      setTotals(counts);
      const rc = Object.values(counts).reduce((s,x)=>s + Number(x || 0), 0);
      setRawCount(rc);
    }).catch((e)=>{
      setTotals({});
      setRawCount(0);
    }).finally(()=>setLoading(false));
  },[]);

  return (
    <div>
      <div className="container">
        <div className="header">
          <div className="header-overlay" />
          <h1>Hasil Voting (Publik)</h1>
        </div>

        <div style={{height:12}} />

        <div className="card">
          <h3>Hasil</h3>
          <p className="small">Dapat dilihat tanpa login. Total suara: {rawCount}</p>

          {loading ? <div className="small">Memuat...</div> : (
            <div className="results-grid">
              {Object.keys(totals).length === 0 ? (
                <div className="small">Belum ada suara.</div>
              ) : Object.keys(totals).map(k => (
                <div className="result-item" key={k}>
                  <div style={{fontWeight:700}}>{k}</div>
                  <div style={{fontSize:24, marginTop:6}}>{totals[k]}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{marginTop:12}}>
            <a href="/" className="btn">Kembali ke Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}
