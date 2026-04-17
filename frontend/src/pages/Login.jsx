import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/tickets');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  const fillDemo = (role) => {
    const demos = {
      admin: { email: 'admin@demo.com', password: 'admin123' },
      agent: { email: 'agent@demo.com', password: 'agent123' },
      customer: { email: 'customer@demo.com', password: 'customer123' },
    };
    setForm(demos[role]);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🎫</div>
        <h1 style={styles.title}>SupportDesk</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        <div style={styles.demoButtons}>
          <span style={styles.demoLabel}>Quick demo:</span>
          {['admin', 'agent', 'customer'].map(role => (
            <button key={role} onClick={() => fillDemo(role)} style={{ ...styles.demoBtn, background: { admin: '#dc2626', agent: '#2563eb', customer: '#16a34a' }[role] }}>
              {role}
            </button>
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={styles.input} placeholder="you@example.com" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={styles.input} placeholder="••••••" />
          </div>
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>Don't have an account? <Link to="/register" style={styles.link}>Register</Link></p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#1e293b,#334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo: { textAlign: 'center', fontSize: 40, marginBottom: 8 },
  title: { textAlign: 'center', margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' },
  subtitle: { textAlign: 'center', color: '#64748b', marginTop: 4, marginBottom: 24 },
  demoButtons: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  demoLabel: { fontSize: 12, color: '#64748b' },
  demoBtn: { color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  submitBtn: { width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' },
  link: { color: '#2563eb', fontWeight: 600 },
};
