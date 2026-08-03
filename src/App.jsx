import { useState } from 'react';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import Input from './Input.jsx';
import { getToken, getStoredUser, setStoredUser, clearSession } from './api.js';
import './App.css';

const PLANT_LABEL = {
  Mysore: 'P2 · Mysore',
  Pondicherry: 'P3 · Pondicherry',
  Varanavasi: 'P4 · Varanavasi',
  Pantnagar: 'P5 · Pantnagar',
};

function Icon({ path }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
const ICONS = {
  dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z',
  report: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
};

export default function App() {
  const [user, setUser] = useState(getToken() ? getStoredUser() : null);
  const [tab, setTab] = useState('input'); // Default to public input page

  function handleLogin(u) {
    setStoredUser(u);
    setUser(u);
    setTab('dashboard'); // Redirect to dashboard post-login
  }
  function handleLogout() {
    clearSession();
    setUser(null);
    setTab('input');
  }

  // Enforce auth conditionally: If they want dashboard but aren't logged in, show login.
  if (tab === 'dashboard' && !user) {
    return <Login onLogin={handleLogin} onBack={() => setTab('input')} />;
  }

  const scope = user 
    ? (user.role === 'admin' ? 'All Plants' : PLANT_LABEL[user.plant] || user.plant) 
    : 'Public / Guest';

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="rane-logo.jpg" alt="Rane Logo" style={{ height: '36px' }} />
        </div>

        <nav className="tabs">
          <button
            className={tab === 'input' ? 'tab active' : 'tab'}
            onClick={() => setTab('input')}
          >
            <Icon path={ICONS.report} /> New Observation
          </button>
          <button
            className={tab === 'dashboard' ? 'tab active' : 'tab'}
            onClick={() => setTab('dashboard')}
          >
            <Icon path={ICONS.dashboard} /> Dashboard
          </button>
        </nav>

        <div className="user-box">
          {user ? (
            <>
              <div className="user-meta">
                <span className="user-name">{user.username}</span>
                <span className="user-scope">{scope}</span>
              </div>
              <button className="logout" onClick={handleLogout} title="Sign out">
                <Icon path={ICONS.logout} />
              </button>
            </>
          ) : (
            <button className="tab active" onClick={() => setTab('dashboard')} style={{ padding: '6px 14px' }}>
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="content">
        {tab === 'dashboard' ? <Dashboard user={user} /> : <Input />}
      </main>
    </div>
  );
}
