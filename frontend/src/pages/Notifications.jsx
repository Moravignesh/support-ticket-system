import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const eventIcons = {
  ticket_assigned: '📌',
  status_updated: '🔄',
  new_comment: '💬',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🔔 Notifications</h1>
          <p style={styles.subtitle}>{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={styles.markAllBtn}>Mark all read</button>
        )}
      </div>

      {loading ? (
        <div style={styles.empty}>Loading…</div>
      ) : notifications.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 48 }}>🔕</div>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {notifications.map(n => (
            <div key={n.id} style={{ ...styles.item, background: n.is_read ? '#fff' : '#eff6ff', borderLeft: `3px solid ${n.is_read ? '#e2e8f0' : '#2563eb'}` }}>
              <div style={styles.itemIcon}>{eventIcons[n.event] || '📣'}</div>
              <div style={styles.itemContent}>
                <p style={styles.itemMsg}>{n.message}</p>
                <div style={styles.itemMeta}>
                  <span style={styles.eventBadge}>{n.event.replace(/_/g, ' ')}</span>
                  <span style={styles.itemTime}>{new Date(n.created_at).toLocaleString()}</span>
                  {n.ticket_id && (
                    <Link to={`/tickets/${n.ticket_id}`} style={styles.viewLink}>View Ticket →</Link>
                  )}
                </div>
              </div>
              {!n.is_read && (
                <button onClick={() => markRead(n.id)} style={styles.readBtn}>✓</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 800, margin: '0 auto', padding: '28px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' },
  subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: 14 },
  markAllBtn: { padding: '8px 18px', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#94a3b8' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  item: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  itemIcon: { fontSize: 22, flexShrink: 0, marginTop: 2 },
  itemContent: { flex: 1 },
  itemMsg: { margin: '0 0 8px', fontSize: 14, color: '#1e293b', lineHeight: 1.5 },
  itemMeta: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  eventBadge: { background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' },
  itemTime: { color: '#94a3b8', fontSize: 12 },
  viewLink: { color: '#2563eb', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  readBtn: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 700, flexShrink: 0 },
};
