import React, { useState } from 'react';
import axiosInstance from './axiosInstance';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('http://127.0.0.1:8000/api/token/', {
        username,
        password,
      });
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      window.location.href = '/branches';
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}

export default LoginForm;