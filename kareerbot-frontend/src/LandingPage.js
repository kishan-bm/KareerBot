import React, { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

export default function LandingPage({ navigate }){
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('login');

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Welcome to KareerBot</h1>
        <button onClick={() => setShowModal(true)}>Get Started</button>
      </header>

      <p>Your personal career AI assistant. Upload your resume, set a goal, and get a step-by-step roadmap.</p>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => {
          const token = localStorage.getItem('kb_token');
          if (!token) return setShowModal(true);
          navigate('/resume');
        }}>Try Resume Bot</button>
        <button onClick={() => {
          const token = localStorage.getItem('kb_token');
          if (!token) return setShowModal(true);
          navigate('/agent/chat');
        }} style={{ marginLeft: 8 }}>Open Agent</button>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 24, width: 520, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <button onClick={() => setTab('login')} style={{ marginRight: 8 }}>Login</button>
                <button onClick={() => setTab('register')}>Register</button>
              </div>
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>

            <div style={{ marginTop: 12 }}>
              {tab === 'login' ? <LoginPage navigate={navigate} /> : <RegisterPage navigate={navigate} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
