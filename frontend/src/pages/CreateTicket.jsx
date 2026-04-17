import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function CreateTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/tickets', form);
      navigate(`/tickets/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create ticket.');
    } finally { setLoading(false); }
  };

  const priorities = [
    { value: 'Low', color: '#16a34a', desc: 'Minor issue, no urgency' },
    { value: 'Medium', color: '#d97706', desc: 'Moderate impact' },
    { value: 'High', color: '#dc2626', desc: 'Critical issue, needs fast resolution 🔥' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.breadcrumb}>
          <Link to="/tickets" style={styles.back}>← Back to Tickets</Link>
        </div>
        <h1 style={styles.title}>Create New Ticket</h1>
        <p style={styles.subtitle}>Describe your issue and we'll get it resolved</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Title <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              type="text" required maxLength={200}
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              style={styles.input}
              placeholder="Brief summary of the issue"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description <span style={{ color: '#dc2626' }}>*</span></label>
            <textarea
              required rows={6}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ ...styles.input, resize: 'vertical' }}
              placeholder="Provide detailed information about the issue, steps to reproduce, expected vs actual behavior…"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Priority</label>
            <div style={styles.priorityGroup}>
              {priorities.map(p => (
                <div
                  key={p.value}
                  onClick={() => setForm({ ...form, priority: p.value })}
                  style={{
                    ...styles.priorityCard,
                    borderColor: form.priority === p.value ? p.color : '#e5e7eb',
                    background: form.priority === p.value ? p.color + '11' : '#fafafa',
                  }}
                >
                  <div style={{ ...styles.priorityDot, background: p.color }} />
                  <div>
                    <div style={{ fontWeight: 700, color: p.color, fontSize: 14 }}>{p.value}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.actions}>
            <Link to="/tickets" style={styles.cancelBtn}>Cancel</Link>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Submitting…' : '🎫 Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 700, margin: '0 auto', padding: '28px 20px' },
  card: { background: '#fff', borderRadius: 16, padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  breadcrumb: { marginBottom: 20 },
  back: { color: '#2563eb', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  title: { margin: 0, fontSize: 24, fontWeight: 800, color: '#1e293b' },
  subtitle: { color: '#64748b', marginTop: 6, marginBottom: 28 },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  field: { marginBottom: 22 },
  label: { display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  priorityGroup: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  priorityCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '2px solid', borderRadius: 10, cursor: 'pointer', flex: 1, minWidth: 150, transition: 'all 0.15s' },
  priorityDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  actions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: { padding: '11px 24px', background: '#f1f5f9', color: '#475569', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  submitBtn: { padding: '11px 28px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
};
