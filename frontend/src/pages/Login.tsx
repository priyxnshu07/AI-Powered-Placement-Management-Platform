import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ErrorMessage from '../components/shared/ErrorMessage';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '../types/api';

// ISP: No role-specific logic here — just authentication entry point
const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const role = await login(email, password);
      
      // Redirect based on role
      switch (role) {
        case 'student': navigate('/student'); break;
        case 'recruiter': navigate('/recruiter'); break;
        case 'placement_officer': navigate('/officer'); break;
        case 'admin': navigate('/admin'); break;
        default: navigate('/');
      }
    } catch (err) {
      const message = isAxiosError<ApiErrorBody>(err) ? err.response?.data?.error : undefined;
      setError(message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg)'
    }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--primary)', margin: 0 }}>PlacementAI</h1>
        <p style={{ color: 'var(--muted)', marginTop: '4px' }}>AI-Powered Placement Management</p>
      </div>

      <div className="card" style={{ width: '400px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>Login</h2>
        
        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="student1@college.edu"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '24px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {loading && <LoadingSpinner />}
      </div>
    </div>
  );
};

export default Login;
