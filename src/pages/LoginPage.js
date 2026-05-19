import React, { useState } from 'react';

function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
const res = await fetch('https://stockpro-backend-production-8344.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed!');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch (err) {
      setError('Cannot connect to server!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb' }}
         className="d-flex align-items-center justify-content-center">

      <div className="card shadow" style={{ width: '400px', borderRadius: '16px' }}>
        <div className="card-body p-5">

          {/* Logo + Title */}
          <div className="text-center mb-4">
            <i className="bi bi-boxes text-primary" style={{ fontSize: '3rem' }}></i>
            <h2 className="mt-2 fw-bold">StockPro</h2>
            <p className="text-muted">Sign in to your account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="alert alert-danger py-2">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label fw-bold">Email</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="admin@stock.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">Password</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-bold"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"/>Signing in...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-muted mt-4 mb-0" style={{ fontSize: '0.8rem' }}>
            <i className="bi bi-shield-lock me-1"></i>
            Secured system
          </p>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;