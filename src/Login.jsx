import { useState } from 'react';
import { login, setToken } from './api.js';

export default function Login({ onLogin, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const res = await login(username.trim(), password);
      setToken(res.token);
      onLogin(res.user);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter') submit();
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        {onBack && (
           <button 
             type="button" 
             onClick={onBack} 
             style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontWeight: 600, padding: 0, marginBottom: '20px', cursor: 'pointer' }}
           >
             &larr; Back to Input Form
           </button>
        )}
        <div className="login-brand">
          <img src="rane-logo.jpg" alt="Rane Logo" style={{ height: '50px', marginBottom: '10px' }} />
        </div>
        <h1>Driver Behaviour Observation</h1>
        <p className="login-sub">Sign in to review observations.</p>

        <label>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={onKey}
          placeholder="e.g. admin or p2user"
          autoFocus
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKey}
          placeholder="Enter your password"
        />

        {error && <div className="login-error">{error}</div>}

        <button className="primary" onClick={submit} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
      <footer className="login-foot">Rane (Madras) Limited · Internal use only</footer>
    </div>
  );
}
