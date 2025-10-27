import React, { useState } from 'react';
import axios from 'axios';
export default function LoginPage({ onLogin, navigate }) {
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
  const res = await axios.post('http://localhost:5000/api/login', { contact, password });
      if (res.data && res.data.token) {
  localStorage.setItem('kb_token', res.data.token);
  localStorage.setItem('kb_user_id', res.data.user_id);
        if (onLogin) onLogin();
        if (navigate) navigate('/agent/chat');
      } else {
        setError('Login failed');
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Login error');
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div>
          <label>Email or Phone</label>
          <input value={contact} onChange={e => setContact(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
