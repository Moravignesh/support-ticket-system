import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TicketCard from '../components/TicketCard';

export default function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTickets = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum, page_size: 15 });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      const res = await api.get(`/tickets?${params}`);
      if (reset) setTickets(res.data);
      else setTickets(prev => [...prev, ...res.data]);
      setHasMore(res.data.length === 15);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    setPage(1);
    fetchTickets(1, true);
  }, [filters]);

  const loadMore = () => { const next = page + 1; setPage(next); fetchTickets(next); };

  const handleFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Support Tickets</h1>
          <p style={styles.pageSubtitle}>{tickets.length} tickets loaded</p>
        </div>
        {user.role === 'customer' && (
          <Link to="/tickets/new" style={styles.newBtn}>+ New Ticket</Link>
        )}
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="🔍 Search tickets…"
          value={filters.search}
          onChange={e => handleFilter('search', e.target.value)}
        />
        <select style={styles.select} value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={styles.select} value={filters.priority} onChange={e => handleFilter('priority', e.target.value)}>
          <option value="">All Priorities</option>
          {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filters.status || filters.priority || filters.search) && (
          <button onClick={() => setFilters({ status: '', priority: '', search: '' })} style={styles.clearBtn}>✕ Clear</button>
        )}
      </div>

      {/* Ticket List */}
      {loading && tickets.length === 0 ? (
        <div style={styles.empty}>Loading tickets…</div>
      ) : tickets.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 48 }}>📭</div>
          <p>No tickets found.</p>
          {user.role === 'customer' && <Link to="/tickets/new" style={styles.newBtn}>Create your first ticket</Link>}
        </div>
      ) : (
        <>
          {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
          {hasMore && (
            <button onClick={loadMore} disabled={loading} style={styles.loadMoreBtn}>
              {loading ? 'Loading…' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin: '0 auto', padding: '28px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  pageTitle: { margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' },
  pageSubtitle: { margin: '4px 0 0', color: '#64748b', fontSize: 14 },
  newBtn: { background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 },
  filterBar: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: 200, padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' },
  select: { padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' },
  clearBtn: { padding: '9px 14px', border: '1.5px solid #fecaca', borderRadius: 8, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 16 },
  loadMoreBtn: { display: 'block', margin: '20px auto 0', padding: '10px 28px', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
};
