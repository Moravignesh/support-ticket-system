import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🎫</div>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join SupportDesk today</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
            { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
          ].map(f => (
            <div key={f.key} style={styles.field}>
              <label style={styles.label}>{f.label}</label>
              <input type={f.type} required value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={styles.input} placeholder={f.placeholder} />
            </div>
          ))}

          <div style={styles.field}>
            <label style={styles.label}>Register as</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={styles.input}>
              <option value="customer">Customer</option>
              <option value="agent">Support Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>Already have an account? <Link to="/login" style={styles.link}>Sign In</Link></p>
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
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  submitBtn: { width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' },
  link: { color: '#2563eb', fontWeight: 600 },
};
