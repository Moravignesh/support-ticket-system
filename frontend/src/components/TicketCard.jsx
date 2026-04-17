import { Link } from 'react-router-dom';

const priorityColors = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };
const statusColors = {
  'Open': '#2563eb',
  'In Progress': '#d97706',
  'Resolved': '#16a34a',
  'Closed': '#6b7280',
};

export default function TicketCard({ ticket }) {
  const isHighPriority = ticket.priority === 'High';
  return (
    <Link to={`/tickets/${ticket.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        ...styles.card,
        borderLeft: `4px solid ${priorityColors[ticket.priority] || '#6b7280'}`,
        boxShadow: isHighPriority ? '0 0 0 2px #fecaca' : '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <span style={styles.ticketId}>#{ticket.id}</span>
            {isHighPriority && <span style={styles.fireIcon}>🔥</span>}
            <span style={styles.title}>{ticket.title}</span>
          </div>
          <div style={styles.badges}>
            <span style={{ ...styles.badge, background: priorityColors[ticket.priority] + '22', color: priorityColors[ticket.priority], border: `1px solid ${priorityColors[ticket.priority]}44` }}>
              {ticket.priority}
            </span>
            <span style={{ ...styles.badge, background: statusColors[ticket.status] + '22', color: statusColors[ticket.status], border: `1px solid ${statusColors[ticket.status]}44` }}>
              {ticket.status}
            </span>
          </div>
        </div>
        <p style={styles.desc}>{ticket.description.substring(0, 100)}{ticket.description.length > 100 ? '…' : ''}</p>
        <div style={styles.footer}>
          <span style={styles.meta}>👤 {ticket.customer?.name || 'Unknown'}</span>
          {ticket.assigned_agent && <span style={styles.meta}>🔧 {ticket.assigned_agent.name}</span>}
          <span style={styles.meta}>🕒 {new Date(ticket.created_at).toLocaleDateString()}</span>
          {ticket.resolution_time_hours != null && (
            <span style={styles.meta}>⏱ {ticket.resolution_time_hours}h</span>
          )}
        </div>
      </div>
    </Link>
  );
}

const styles = {
  card: { background: '#fff', borderRadius: 10, padding: '14px 18px', marginBottom: 12, transition: 'transform 0.15s', cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 8 },
  ticketId: { color: '#94a3b8', fontSize: 13, fontWeight: 600 },
  fireIcon: { fontSize: 16 },
  title: { fontWeight: 600, color: '#1e293b', fontSize: 15 },
  badges: { display: 'flex', gap: 8 },
  badge: { padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  desc: { color: '#64748b', fontSize: 13, margin: '8px 0 10px', lineHeight: 1.5 },
  footer: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  meta: { color: '#94a3b8', fontSize: 12 },
};
