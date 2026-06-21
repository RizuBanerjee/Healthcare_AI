import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Clock, TrendingUp, FileText, Stethoscope, ScanLine, Search, Activity, AlertCircle } from 'lucide-react';

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];

export default function History() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total_reports: 0, most_common: 'N/A' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    Promise.all([
      fetch('http://127.0.0.1:5000/reports').then(r => r.json()).catch(() => []),
      fetch('http://127.0.0.1:5000/stats').then(r => r.json()).catch(() => ({ total_reports: 0, most_common: 'N/A' })),
    ]).then(([reportsData, statsData]) => {
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  const symptomCount = reports.filter(r => r.symptom_disease).length;
  const skinCount = reports.filter(r => r.skin_disease).length;

  const diseaseCount = {};
  reports.forEach(r => {
    if (r.symptom_disease) {
      diseaseCount[r.symptom_disease] = (diseaseCount[r.symptom_disease] || 0) + 1;
    }
  });
  const barChartData = Object.entries(diseaseCount)
    .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const pieData = barChartData.slice(0, 5).map(d => ({ name: d.name, value: d.count }));

  const filtered = reports.filter(r => {
    const matchSearch = !search ||
      r.symptom_disease?.toLowerCase().includes(search.toLowerCase()) ||
      r.skin_disease?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterType === 'all' ||
      (filterType === 'symptom' && r.symptom_disease) ||
      (filterType === 'skin' && r.skin_disease);
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const statCards = [
    { label: 'Total Reports', value: loading ? '—' : stats.total_reports, icon: FileText, color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
    { label: 'Most Common Disease', value: loading ? '—' : (stats.most_common || 'N/A'), icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Symptom Predictions', value: loading ? '—' : symptomCount, icon: Stethoscope, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Skin Predictions', value: loading ? '—' : skinCount, icon: ScanLine, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>
      {/* Header */}
      <div className="fade-in-up" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={26} color="#8B5CF6" />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.03em' }}>
              Prediction History
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
              Analytics and historical prediction data
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <div key={label} className={`card-elevated fade-in-up fade-in-up-delay-${i}`} style={{ padding: '18px 20px' }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', marginBottom: 3 }}>
              {loading
                ? <div style={{ width: 50, height: 24, background: '#f1f5f9', borderRadius: 5, animation: 'pulse-soft 1.5s infinite' }} />
                : value}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {!loading && barChartData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }} className="hc-charts-grid">
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={17} color="#2563EB" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>Disease Distribution</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Top predicted diseases</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barChartData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={17} color="#10B981" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>Breakdown</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Top 5 diseases</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="card fade-in-up" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>Prediction History</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search predictions..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ border: '1.5px solid var(--border)', borderRadius: 9, padding: '8px 12px 8px 30px', fontSize: 13, outline: 'none', width: 200, fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#2563EB')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1); }}
              style={{ border: '1.5px solid var(--border)', borderRadius: 9, padding: '8px 12px', fontSize: 13, outline: 'none', background: 'white', fontFamily: 'inherit', cursor: 'pointer', color: 'var(--foreground)' }}
            >
              <option value="all">All Types</option>
              <option value="symptom">Symptom Only</option>
              <option value="skin">Skin Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 24px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                {[60, 180, 140, 120].map((w, j) => (
                  <div key={j} style={{ height: 16, width: w, background: '#f1f5f9', borderRadius: 5, animation: 'pulse-soft 1.5s infinite' }} />
                ))}
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--muted-foreground)' }}>
            {search || filterType !== 'all' ? (
              <>
                <Search size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No results found</div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>Try adjusting your search or filter</div>
              </>
            ) : (
              <>
                <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No predictions yet</div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>Your prediction history will appear here</div>
              </>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Symptom Disease', 'Skin Disease', 'Timestamp'].map(header => (
                    <th key={header} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', background: '#f8fafc' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((report) => (
                  <tr key={report.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '13px 18px', fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)' }}>#{report.id}</td>
                    <td style={{ padding: '13px 18px' }}>
                      {report.symptom_disease
                        ? <span
                            className="badge badge-blue"
                            style={{
                              fontSize: 12,
                              color: "#000000",
                              fontWeight: 600
                            }}
                          >
                          {report.symptom_disease}
                        </span>
                        : <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      {report.skin_disease
                        ? <span
                            className="badge badge-success"
                            style={{
                              fontSize: 12,
                              color: "#000000",
                              fontWeight: 600
                            }}
                          >
                            {report.skin_disease}
                          </span>
                        : <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                      {report.timestamp
                        ? new Date(report.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} results
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, background: 'white', color: 'var(--foreground)', fontFamily: 'inherit' }}>
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  style={{ border: '1.5px solid', borderColor: page === i + 1 ? '#2563EB' : 'var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: page === i + 1 ? '#2563EB' : 'white', color: page === i + 1 ? 'white' : 'var(--foreground)', fontFamily: 'inherit' }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, background: 'white', color: 'var(--foreground)', fontFamily: 'inherit' }}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hc-charts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
