import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const priorityColors = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };
const statusColors = { 'Open': '#2563eb', 'In Progress': '#d97706', 'Resolved': '#16a34a', 'Closed': '#6b7280' };
const STATUS_FLOW = { 'Open': 'In Progress', 'In Progress': 'Resolved', 'Resolved': 'Closed', 'Closed': null };

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [error, setError] = useState('');
  const commentsEndRef = useRef(null);

  const fetchTicket = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/comments`),
      ]);
      setTicket(tRes.data);
      setComments(cRes.data);
    } catch (e) { setError('Failed to load ticket.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTicket(); }, [id]);

  useEffect(() => {
    if (user.role === 'admin') {
      api.get('/admin/agents').then(res => setAgents(res.data)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleAdvanceStatus = async () => {
    const next = STATUS_FLOW[ticket.status];
    if (!next) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/tickets/${id}/status`, { status: next });
      setTicket(res.data);
    } catch (e) { setError(e.response?.data?.detail || 'Status update failed.'); }
    finally { setActionLoading(false); }
  };

  const handleAssign = async () => {
    if (!selectedAgent) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/tickets/${id}/assign`, { agent_id: parseInt(selectedAgent) });
      setTicket(res.data);
      setSelectedAgent('');
    } catch (e) { setError(e.response?.data?.detail || 'Assignment failed.'); }
    finally { setActionLoading(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/tickets/${id}/comments`, { message: newComment });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (e) { setError(e.response?.data?.detail || 'Comment failed.'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading ticket…</div>;
  if (!ticket) return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>{error || 'Ticket not found.'}</div>;

  const nextStatus = STATUS_FLOW[ticket.status];
  const isAgentOrAdmin = user.role === 'agent' || user.role === 'admin';

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.breadcrumb}>
        <Link to="/tickets" style={styles.back}>← Back to Tickets</Link>
      </div>

      <div style={styles.grid}>
        {/* Main Column */}
        <div style={styles.main}>
          {/* Ticket Info */}
          <div style={styles.card}>
            <div style={styles.ticketHeader}>
              <span style={styles.ticketId}>#{ticket.id}</span>
              {ticket.priority === 'High' && <span>🔥</span>}
              <h1 style={styles.ticketTitle}>{ticket.title}</h1>
            </div>
            <div style={styles.badgeRow}>
              <span style={{ ...styles.badge, background: priorityColors[ticket.priority] + '20', color: priorityColors[ticket.priority], border: `1px solid ${priorityColors[ticket.priority]}40` }}>
                ⚡ {ticket.priority} Priority
              </span>
              <span style={{ ...styles.badge, background: statusColors[ticket.status] + '20', color: statusColors[ticket.status], border: `1px solid ${statusColors[ticket.status]}40` }}>
                {ticket.status}
              </span>
            </div>
            <p style={styles.description}>{ticket.description}</p>
            <div style={styles.metaGrid}>
              <div style={styles.metaItem}><span style={styles.metaLabel}>Created</span><span>{new Date(ticket.created_at).toLocaleString()}</span></div>
              <div style={styles.metaItem}><span style={styles.metaLabel}>Updated</span><span>{new Date(ticket.updated_at).toLocaleString()}</span></div>
              {ticket.resolved_at && <div style={styles.metaItem}><span style={styles.metaLabel}>Resolved</span><span>{new Date(ticket.resolved_at).toLocaleString()}</span></div>}
              {ticket.resolution_time_hours != null && <div style={styles.metaItem}><span style={styles.metaLabel}>Resolution Time</span><span style={{ color: '#16a34a', fontWeight: 700 }}>{ticket.resolution_time_hours}h</span></div>}
              <div style={styles.metaItem}><span style={styles.metaLabel}>Customer</span><span>{ticket.customer?.name} ({ticket.customer?.email})</span></div>
              <div style={styles.metaItem}><span style={styles.metaLabel}>Assigned Agent</span><span style={{ color: ticket.assigned_agent ? '#2563eb' : '#94a3b8' }}>{ticket.assigned_agent ? ticket.assigned_agent.name : 'Unassigned'}</span></div>
            </div>
            {error && <div style={styles.error}>{error}</div>}
          </div>

          {/* Comments / Chat */}
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>💬 Conversation ({comments.length})</h2>
            <div style={styles.chatBox}>
              {comments.length === 0 && <div style={styles.noComments}>No messages yet. Start the conversation.</div>}
              {comments.map(c => {
                const isMe = c.author_id === user.id;
                return (
                  <div key={c.id} style={{ ...styles.bubble, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <div style={{ ...styles.avatar, background: isMe ? '#2563eb' : '#64748b' }}>
                      {c.author?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.bubbleContent}>
                      <div style={styles.bubbleMeta}>
                        <span style={styles.bubbleAuthor}>{c.author?.name} <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>({c.author?.role})</span></span>
                        <span style={styles.bubbleTime}>{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ ...styles.bubbleText, background: isMe ? '#eff6ff' : '#f8fafc', border: `1px solid ${isMe ? '#bfdbfe' : '#e2e8f0'}` }}>
                        {c.message}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>

            {ticket.status !== 'Closed' && (
              <form onSubmit={handleComment} style={styles.commentForm}>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  style={styles.commentInput}
                  placeholder="Type your message…"
                />
                <button type="submit" disabled={actionLoading || !newComment.trim()} style={styles.sendBtn}>
                  {actionLoading ? '…' : '➤ Send'}
                </button>
              </form>
            )}
            {ticket.status === 'Closed' && <div style={styles.closedNote}>🔒 This ticket is closed. No new messages allowed.</div>}
          </div>
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Status Actions */}
          {isAgentOrAdmin && nextStatus && (
            <div style={styles.card}>
              <h3 style={styles.sideTitle}>Update Status</h3>
              <p style={styles.sideDesc}>Move ticket from <strong>{ticket.status}</strong> → <strong>{nextStatus}</strong></p>
              <button onClick={handleAdvanceStatus} disabled={actionLoading} style={{ ...styles.actionBtn, background: statusColors[nextStatus] }}>
                {actionLoading ? 'Updating…' : `Set "${nextStatus}"`}
              </button>
            </div>
          )}

          {/* Assign Ticket */}
          {user.role === 'admin' && (
            <div style={styles.card}>
              <h3 style={styles.sideTitle}>Assign Agent</h3>
              <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} style={styles.sideSelect}>
                <option value="">Select agent…</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button onClick={handleAssign} disabled={!selectedAgent || actionLoading} style={styles.actionBtn}>
                {actionLoading ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          )}

          {/* SLA Info */}
          <div style={styles.card}>
            <h3 style={styles.sideTitle}>SLA / Priority Info</h3>
            {ticket.priority === 'High' && (
              <div style={styles.slaBanner}>🔥 High priority — target resolution: <strong>4 hours</strong></div>
            )}
            {ticket.priority === 'Medium' && (
              <div style={{ ...styles.slaBanner, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>⚡ Medium priority — target resolution: <strong>24 hours</strong></div>
            )}
            {ticket.priority === 'Low' && (
              <div style={{ ...styles.slaBanner, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>📋 Low priority — target resolution: <strong>72 hours</strong></div>
            )}
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 12 }}>
              <div>Created: {new Date(ticket.created_at).toLocaleString()}</div>
              {ticket.resolved_at && <div style={{ color: '#16a34a', marginTop: 4 }}>✅ Resolved: {new Date(ticket.resolved_at).toLocaleString()}</div>}
              {ticket.resolution_time_hours != null && <div style={{ color: '#16a34a', marginTop: 4, fontWeight: 700 }}>Total: {ticket.resolution_time_hours} hours</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '24px 20px' },
  breadcrumb: { marginBottom: 16 },
  back: { color: '#2563eb', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' },
  main: { display: 'flex', flexDirection: 'column', gap: 20 },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  ticketHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  ticketId: { color: '#94a3b8', fontWeight: 700, fontSize: 15 },
  ticketTitle: { margin: 0, fontSize: 22, fontWeight: 800, color: '#1e293b' },
  badgeRow: { display: 'flex', gap: 10, marginBottom: 16 },
  badge: { padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  description: { color: '#475569', fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 20 },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  metaItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  metaLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: 8, marginTop: 12, fontSize: 13 },
  sectionTitle: { margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' },
  chatBox: { minHeight: 200, maxHeight: 400, overflowY: 'auto', padding: '8px 0', marginBottom: 16 },
  noComments: { textAlign: 'center', color: '#94a3b8', padding: '40px 0' },
  bubble: { display: 'flex', gap: 10, marginBottom: 16 },
  avatar: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  bubbleContent: { flex: 1, maxWidth: '75%' },
  bubbleMeta: { display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4, flexWrap: 'wrap' },
  bubbleAuthor: { fontSize: 13, fontWeight: 700, color: '#374151' },
  bubbleTime: { fontSize: 11, color: '#94a3b8' },
  bubbleText: { borderRadius: 10, padding: '10px 14px', fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word' },
  commentForm: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  commentInput: { flex: 1, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' },
  sendBtn: { padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  closedNote: { textAlign: 'center', color: '#94a3b8', padding: '12px', background: '#f8fafc', borderRadius: 8, fontSize: 13 },
  sideTitle: { margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#374151' },
  sideDesc: { fontSize: 13, color: '#64748b', marginBottom: 10 },
  actionBtn: { width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14, marginTop: 4 },
  sideSelect: { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, marginBottom: 10 },
  slaBanner: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: 8, fontSize: 13 },
};
