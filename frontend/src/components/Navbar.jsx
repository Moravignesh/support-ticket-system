import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(res => {
      setUnread(res.data.filter(n => !n.is_read).length);
    }).catch(() => {});
  }, [user, location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleBadgeColor = {
    admin: '#dc2626',
    agent: '#2563eb',
    customer: '#16a34a',
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <Link to="/" style={styles.brandLink}>🎫 SupportDesk</Link>
      </div>
      {user && (
        <div style={styles.links}>
          <Link to="/tickets" style={styles.link}>Tickets</Link>
          {user.role === 'customer' && (
            <Link to="/tickets/new" style={styles.link}>+ New Ticket</Link>
          )}
          {user.role === 'admin' && (
            <Link to="/admin" style={styles.link}>Admin Dashboard</Link>
          )}
          <Link to="/notifications" style={{ ...styles.link, position: 'relative' }}>
            🔔
            {unread > 0 && (
              <span style={styles.badge}>{unread}</span>
            )}
          </Link>
          <div style={styles.userInfo}>
            <span style={{ ...styles.roleBadge, background: roleBadgeColor[user.role] || '#6b7280' }}>
              {user.role}
            </span>
            <span style={styles.userName}>{user.name}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: { background: '#1e293b', color: '#fff', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  brand: { fontWeight: 700, fontSize: 20 },
  brandLink: { color: '#f8fafc', textDecoration: 'none' },
  links: { display: 'flex', alignItems: 'center', gap: 20 },
  link: { color: '#cbd5e1', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  badge: { background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 11, padding: '1px 5px', position: 'absolute', top: -6, right: -8 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid #334155', paddingLeft: 16 },
  roleBadge: { color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' },
  userName: { color: '#e2e8f0', fontSize: 14 },
  logoutBtn: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
};
