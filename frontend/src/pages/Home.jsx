import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, TrendingUp, Stethoscope, ScanLine, Clock, ArrowRight, Activity,
  Shield, Zap, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const quickActions = [
  {
    to: '/symptoms',
    icon: Stethoscope,
    label: 'Symptom Checker',
    description: 'AI-powered disease prediction from symptoms',
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.07)',
  },
  {
    to: '/skin',
    icon: ScanLine,
    label: 'Skin AI',
    description: 'Upload an image to detect skin conditions',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.07)',
  },
  {
    to: '/report',
    icon: FileText,
    label: 'Health Report',
    description: 'Generate a comprehensive AI health report',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.07)',
  },
  {
    to: '/history',
    icon: Clock,
    label: 'History',
    description: 'View all past predictions and analytics',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.07)',
  },
];

export default function Home() {
  const [stats, setStats] = useState({ total_reports: 0, most_common: 'N/A' });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://127.0.0.1:5000/stats').then(r => r.json()).catch(() => ({ total_reports: 0, most_common: 'N/A' })),
      fetch('http://127.0.0.1:5000/reports').then(r => r.json()).catch(() => []),
    ]).then(([statsData, reportsData]) => {
      setStats(statsData);
      setReports(Array.isArray(reportsData) ? reportsData : []);
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
  const chartData = Object.entries(diseaseCount)
    .map(([name, count]) => ({ name: name.length > 15 ? name.slice(0, 15) + '…' : name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const recentReports = reports.slice(0, 5);

  const statCards = [
    { label: 'Total Reports', value: loading ? '—' : stats.total_reports, icon: FileText, color: '#2563EB', bg: 'rgba(37,99,235,0.08)', delay: '' },
    { label: 'Most Common Disease', value: loading ? '—' : (stats.most_common || 'N/A'), icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.08)', delay: 'fade-in-up-delay-1' },
    { label: 'Symptom Predictions', value: loading ? '—' : symptomCount, icon: Stethoscope, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', delay: 'fade-in-up-delay-2' },
    { label: 'Skin Predictions', value: loading ? '—' : skinCount, icon: ScanLine, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', delay: 'fade-in-up-delay-3' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px' }}>
      {/* Hero */}
      <div
        className="fade-in-up"
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #1d4ed8 60%, #1e40af 100%)',
          borderRadius: 20,
          padding: '52px 48px',
          marginTop: 32,
          marginBottom: 36,
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
        }}
      >
        <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', right: 80, bottom: -80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 8, display: 'flex' }}>
            <Shield size={22} color="white" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            AI-Powered Platform
          </span>
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          Healthcare AI Platform
        </h1>
        <p style={{ fontSize: 17, opacity: 0.85, margin: '0 0 28px', maxWidth: 500, lineHeight: 1.6 }}>
          AI-powered disease prediction and healthcare assistance. Get instant insights from symptoms and skin images.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/symptoms" style={{
            background: 'white', color: '#2563EB', padding: '11px 22px', borderRadius: 10,
            fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Zap size={16} />
            Check Symptoms
          </Link>
          <Link to="/history" style={{
            background: 'rgba(255,255,255,0.15)', color: 'white', padding: '11px 22px', borderRadius: 10,
            fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            View Analytics
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map(({ label, value, icon: Icon, color, bg, delay }) => (
          <div key={label} className={`card-elevated fade-in-up ${delay}`} style={{ padding: '20px 22px' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              {loading
                ? <div style={{ width: 60, height: 28, background: '#f1f5f9', borderRadius: 6, animation: 'pulse-soft 1.5s infinite' }} />
                : value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {quickActions.map(({ to, icon: Icon, label, description, color, bg }) => (
            <Link
              key={to}
              to={to}
              className="card-elevated"
              style={{ padding: '20px 22px', textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={color} />
                </div>
                <ChevronRight size={18} color="var(--muted-foreground)" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 5, letterSpacing: '-0.01em' }}>
                {label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                {description}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Chart + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }} className="hc-dashboard-grid">
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>Disease Distribution</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Symptom prediction breakdown</div>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
              <Activity size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>No prediction data yet</div>
              <div style={{ fontSize: 13, marginTop: 4, opacity: 0.7 }}>Run your first symptom check to see analytics</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>Recent Predictions</div>
            <Link to="/history" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              See all <ArrowRight size={14} />
            </Link>
          </div>
          {recentReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted-foreground)' }}>
              <Clock size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 13 }}>No predictions yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentReports.map((report) => (
                <div key={report.id} style={{ padding: '12px 14px', background: 'var(--muted)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>
                    {report.symptom_disease || report.skin_disease || 'Unknown'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                    {report.timestamp ? new Date(report.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hc-dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
