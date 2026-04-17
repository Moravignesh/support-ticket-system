import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';

const COLORS = { Open: '#2563eb', 'In Progress': '#d97706', Resolved: '#16a34a', Closed: '#6b7280' };
const PRIORITY_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([api.get('/admin/analytics'), api.get('/admin/users')])
      .then(([aRes, uRes]) => { setAnalytics(aRes.data); setUsers(uRes.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading analytics…</div>;
  if (!analytics) return <div style={{ padding: 40, textAlign: 'center' }}>Failed to load.</div>;

  const statusData = [
    { name: 'Open', value: analytics.open_tickets, color: COLORS.Open },
    { name: 'In Progress', value: analytics.in_progress_tickets, color: COLORS['In Progress'] },
    { name: 'Resolved', value: analytics.resolved_tickets, color: COLORS.Resolved },
    { name: 'Closed', value: analytics.closed_tickets, color: COLORS.Closed },
  ].filter(d => d.value > 0);

  const priorityData = Object.entries(analytics.tickets_by_priority).map(([k, v]) => ({
    name: k, value: v, fill: PRIORITY_COLORS[k] || '#6b7280',
  }));

  const statCards = [
    { label: 'Total Tickets', value: analytics.total_tickets, icon: '🎫', color: '#2563eb' },
    { label: 'Open', value: analytics.open_tickets, icon: '📂', color: '#2563eb' },
    { label: 'In Progress', value: analytics.in_progress_tickets, icon: '⚙️', color: '#d97706' },
    { label: 'Resolved', value: analytics.resolved_tickets, icon: '✅', color: '#16a34a' },
    { label: 'Avg Resolution', value: analytics.avg_resolution_time_hours != null ? `${analytics.avg_resolution_time_hours}h` : 'N/A', icon: '⏱', color: '#7c3aed' },
    { label: 'Total Users', value: users.length, icon: '👥', color: '#0891b2' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Admin Dashboard</h1>
          <p style={styles.pageSubtitle}>Full system overview and analytics</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['overview', 'users', 'tickets'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...styles.tab, ...(tab === t ? styles.activeTab : {}) }}>
            {{ overview: '📊 Overview', users: '👥 Users', tickets: '🎫 Recent Tickets' }[t]}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Stat Cards */}
          <div style={styles.statsGrid}>
            {statCards.map(s => (
              <div key={s.label} style={{ ...styles.statCard, borderTop: `3px solid ${s.color}` }}>
                <div style={styles.statIcon}>{s.icon}</div>
                <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={styles.chartsGrid}>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Ticket Status Distribution</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No data</div>}
            </div>

            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Tickets by Priority</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>All Users ({users.length})</h2>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {['ID', 'Name', 'Email', 'Role', 'Status', 'Joined'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>#{u.id}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{u.name}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.roleBadge, background: { admin: '#dc2626', agent: '#2563eb', customer: '#16a34a' }[u.role] + '20', color: { admin: '#dc2626', agent: '#2563eb', customer: '#16a34a' }[u.role] }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={styles.td}><span style={{ color: u.is_active ? '#16a34a' : '#dc2626' }}>{u.is_active ? '✅ Active' : '❌ Inactive'}</span></td>
                  <td style={styles.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'tickets' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Recent Tickets</h2>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {['ID', 'Title', 'Priority', 'Status', 'Customer', 'Agent', 'Created', 'Resolution'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.recent_tickets.map(t => (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}>
                    <Link to={`/tickets/${t.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>#{t.id}</Link>
                  </td>
                  <td style={{ ...styles.td, maxWidth: 200 }}>{t.title}</td>
                  <td style={styles.td}><span style={{ color: PRIORITY_COLORS[t.priority], fontWeight: 700 }}>{t.priority}</span></td>
                  <td style={styles.td}><span style={{ color: COLORS[t.status] || '#6b7280' }}>{t.status}</span></td>
                  <td style={styles.td}>{t.customer?.name || '-'}</td>
                  <td style={styles.td}>{t.assigned_agent?.name || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                  <td style={styles.td}>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>{t.resolution_time_hours != null ? `${t.resolution_time_hours}h` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '28px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  pageTitle: { margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' },
  pageSubtitle: { margin: '4px 0 0', color: '#64748b', fontSize: 14 },
  tabs: { display: 'flex', gap: 8, marginBottom: 24 },
  tab: { padding: '9px 20px', border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, background: '#fff', color: '#64748b' },
  activeTab: { background: '#2563eb', color: '#fff', borderColor: '#2563eb' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 12, padding: '20px 16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 13, color: '#64748b', marginTop: 6 },
  chartsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  chartCard: { background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#374151' },
  card: { background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#1e293b' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead: { background: '#f8fafc' },
  th: { padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 12px', color: '#374151', verticalAlign: 'middle' },
  roleBadge: { padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
};
