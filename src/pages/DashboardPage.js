import React, { useState, useEffect, useCallback } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Tooltip as CTooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, CTooltip, Legend, Filler);

const BASE_URL = 'https://stockpro-backend-production-8344.up.railway.app';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #14b8a6, #6366f1)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #6366f1, #ec4899)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
  'linear-gradient(135deg, #ec4899, #6366f1)',
  'linear-gradient(135deg, #64748b, #334155)',
  'linear-gradient(135deg, #0ea5e9, #6366f1)',
];

// ✅ Product image helper
const getProductImage = (id) => localStorage.getItem(`productImg_${id}`) || null;

// ✅ Dashboard Product Avatar — shows image or gradient initials
function DashProductAvatar({ product, index, size = 24 }) {
  const img  = product?.id ? getProductImage(product.id) : null;
  const name = product?.name || product?.product_name || '??';
  const grad = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size > 28 ? 9 : 7,
      background: img ? 'none' : grad,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color: '#fff', flexShrink: 0,
      overflow: 'hidden',
      border: img ? '1.5px solid rgba(20,184,166,0.4)' : 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      {img
        ? <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : name.slice(0, 2).toUpperCase()
      }
    </div>
  );
}

const genSparkData = (base, count = 10, variance = 0.3) =>
  Array.from({ length: count }, (_, i) => ({
    v: Math.max(0, base + (Math.random() - 0.5) * base * variance + (i * base * 0.02)),
  }));

function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(window.innerWidth < bp);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < bp);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [bp]);
  return mobile;
}

function useCountUp(target, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let current = 0;
      const end = typeof target === 'number' ? target : 0;
      if (end === 0) return;
      const step = end / 30;
      const timer = setInterval(() => {
        current += step;
        if (current >= end) { setVal(end); clearInterval(timer); }
        else setVal(Math.floor(current));
      }, 20);
      return () => clearInterval(timer);
    }, delay + 100);
    return () => clearTimeout(t);
  }, [target, delay]);
  return val;
}

function SparkCard({ label, value, icon, color, sparkData, trend, sub, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const animVal = useCountUp(typeof value === 'number' ? value : 0, delay);
  const isMobile = useIsMobile();
  const trendUp = trend >= 0;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)',
      padding: isMobile ? '14px 12px 0 12px' : '20px 20px 0 20px',
      overflow: 'hidden', position: 'relative',
      transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
      opacity: visible ? 1 : 0,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      boxSizing: 'border-box',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px ${color}40`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; }}>

      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.08, filter: 'blur(20px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ minWidth: 0, flex: 1, marginRight: 6 }}>
          <div style={{ fontSize: isMobile ? '0.58rem' : '0.72rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-1px' }}>
            {typeof value === 'string' ? value : animVal.toLocaleString()}
          </div>
        </div>
        <div style={{ width: isMobile ? 30 : 40, height: isMobile ? 30 : 40, borderRadius: 10, background: `linear-gradient(135deg, ${color}30, ${color}15)`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '0.85rem' : '1.1rem', color: color, flexShrink: 0 }}>
          <i className={`bi ${icon}`}></i>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '2px 6px', borderRadius: 20, fontSize: '0.62rem', fontWeight: 700, background: trendUp ? 'rgba(0,201,167,0.2)' : 'rgba(231,76,60,0.2)', color: trendUp ? '#00c9a7' : '#e74c4c', border: `1px solid ${trendUp ? 'rgba(0,201,167,0.3)' : 'rgba(231,76,60,0.3)'}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <i className={`bi bi-arrow-${trendUp ? 'up' : 'down'}-short`} style={{ fontSize: 10 }}></i>
          {Math.abs(trend)}%
        </span>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
      </div>

      <div style={{ height: isMobile ? 38 : 55, marginLeft: isMobile ? -12 : -20, marginRight: isMobile ? -12 : -20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#grad-${label})`} dot={false} animationDuration={1500} />
            <Tooltip content={({ active, payload }) => active && payload?.length ? (
              <div style={{ background: 'rgba(0,0,0,0.8)', borderRadius: 6, padding: '3px 7px', fontSize: 10, color: '#fff' }}>{Math.round(payload[0].value)}</div>
            ) : null} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DashboardPage({ darkMode }) {
  const isMobile = useIsMobile();

  const [products, setProducts]         = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [chartRange, setChartRange]     = useState('week');
  const [chartType, setChartType]       = useState('line');
  const [lastRefresh, setLastRefresh]   = useState(new Date());
  const [refreshing, setRefreshing]     = useState(false);
  const [hoveredCat, setHoveredCat]     = useState(null);
  const [showAllTx, setShowAllTx]       = useState(false);
  const [txSearch, setTxSearch]         = useState('');
  const [txFilter, setTxFilter]         = useState('all');
  const [txPage, setTxPage]             = useState(1);
  const TX_PAGE_SIZE = 10;

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const dm = {
    bg:     darkMode ? '#060d1a' : '#f1f5f9',
    card:   darkMode ? 'rgba(15,23,42,0.9)'  : 'rgba(255,255,255,0.92)',
    card2:  darkMode ? 'rgba(13,18,35,0.95)' : 'rgba(248,250,252,0.95)',
    border: darkMode ? 'rgba(51,65,85,0.6)'  : 'rgba(226,232,240,0.9)',
    text:   darkMode ? '#f1f5f9' : '#0f172a',
    muted:  darkMode ? '#64748b' : '#64748b',
    hover:  darkMode ? 'rgba(20,184,166,0.08)' : 'rgba(20,184,166,0.06)',
  };

  const glass = {
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    background: dm.card, border: `1px solid ${dm.border}`,
    boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(15,23,42,0.08)',
    boxSizing: 'border-box',
  };

  const fetchAll = useCallback(() => {
    setRefreshing(true);
    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${BASE_URL}/api/products`,     { headers }).then(r => r.json()),
      fetch(`${BASE_URL}/api/transactions`, { headers }).then(r => r.json()),
      fetch(`${BASE_URL}/api/suppliers`,    { headers }).then(r => r.json()),
    ]).then(([p, t, s]) => {
      if (Array.isArray(p)) setProducts(p);
      if (Array.isArray(t)) setTransactions(t);
      if (Array.isArray(s)) setSuppliers(s);
      setLastRefresh(new Date());
    }).catch(() => {}).finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const lowStockItems = products.filter(p => p.quantity <= p.min_quantity);
  const today         = new Date().toLocaleDateString();
  const todayTx       = transactions.filter(t => new Date(t.created_at).toLocaleDateString() === today);
  const categories    = [...new Set(products.map(p => p.category || 'General'))];
  const catColors     = ['#1e6bde', '#00c9a7', '#f59f00', '#8b5cf6', '#e74c4c', '#06b6d4'];

  const filteredTx = transactions.filter(t => {
    const matchSearch = txSearch ? (t.product_name || '').toLowerCase().includes(txSearch.toLowerCase()) : true;
    const matchType   = txFilter === 'all' ? true : t.type === txFilter;
    return matchSearch && matchType;
  });
  const txTotalPages = Math.ceil(filteredTx.length / TX_PAGE_SIZE);
  const paginatedTx  = filteredTx.slice((txPage - 1) * TX_PAGE_SIZE, txPage * TX_PAGE_SIZE);

  const getRangeDays = () => chartRange === 'today' ? 1 : chartRange === 'week' ? 7 : 30;
  const rangeLabels = Array.from({ length: getRangeDays() }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (getRangeDays() - 1 - i));
    return chartRange === 'today'
      ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const inData  = rangeLabels.map(label => transactions.filter(t => t.type === 'in'  && new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === label).reduce((s, t) => s + t.quantity, 0));
  const outData = rangeLabels.map(label => transactions.filter(t => t.type === 'out' && new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === label).reduce((s, t) => s + t.quantity, 0));

  const chartDatasets = chartType === 'line'
    ? [
        { label: 'Stock In',  data: inData,  borderColor: '#14b8a6', backgroundColor: 'rgba(20,184,166,0.1)', fill: true, tension: 0.4, pointRadius: isMobile ? 2 : 4, pointBackgroundColor: '#14b8a6', pointHoverRadius: 7 },
        { label: 'Stock Out', data: outData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)',  fill: true, tension: 0.4, pointRadius: isMobile ? 2 : 4, pointBackgroundColor: '#ef4444', pointHoverRadius: 7 },
      ]
    : [
        { label: 'Stock In',  data: inData,  backgroundColor: 'rgba(20,184,166,0.7)', borderRadius: 6, borderSkipped: false },
        { label: 'Stock Out', data: outData, backgroundColor: 'rgba(239,68,68,0.6)',  borderRadius: 6, borderSkipped: false },
      ];

  const chartData = { labels: rangeLabels, datasets: chartDatasets };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { color: dm.muted, boxWidth: 10, padding: 12, font: { size: 11 } } },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.98)',
        titleColor: dm.text, bodyColor: dm.muted,
        borderColor: dm.border, borderWidth: 1,
        padding: 10, cornerRadius: 10, boxPadding: 4,
      },
    },
    scales: {
      x: { grid: { color: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, ticks: { color: dm.muted, font: { size: isMobile ? 9 : 11 }, maxTicksLimit: isMobile ? 4 : 7 } },
      y: { grid: { color: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, ticks: { color: dm.muted, font: { size: isMobile ? 9 : 11 } }, beginAtZero: true },
    },
  };

  const doughnutData = {
    labels: categories,
    datasets: [{
      data: categories.map(c => products.filter(p => (p.category || 'General') === c).length),
      backgroundColor: categories.map((c, i) => hoveredCat === c ? catColors[i % catColors.length] : catColors[i % catColors.length] + (hoveredCat ? '60' : 'ff')),
      borderWidth: 0, hoverOffset: 12,
    }],
  };

  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.98)',
        titleColor: dm.text, bodyColor: dm.muted,
        borderColor: dm.border, borderWidth: 1, padding: 10, cornerRadius: 8,
      },
    },
  };

  const topSuppliers = suppliers
    .map(s => ({
      ...s,
      txCount: transactions.filter(t => {
        const prod = products.find(p => p.id === t.product_id);
        return prod?.supplier_id === s.id;
      }).length,
    }))
    .sort((a, b) => b.txCount - a.txCount)
    .slice(0, 5);

  const now = new Date();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(20,184,166,0.3)', borderTop: '3px solid #14b8a6', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: dm.muted, fontSize: 14 }}>Loading dashboard...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', overflowX: 'hidden', background: dm.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: isMobile ? 8 : 0, marginBottom: 14, width: '100%' }}>
        <div>
          <h4 style={{ fontWeight: 800, margin: 0, color: dm.text, fontSize: isMobile ? '1rem' : '1.4rem', letterSpacing: '-0.5px' }}>
            Welcome back, {user.name || 'Admin'}! 👋
          </h4>
          <p style={{ margin: '3px 0 0', color: dm.muted, fontSize: '0.82rem' }}>Here's what's happening with your store today.</p>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: dm.muted }}>Updated {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <button onClick={fetchAll} style={{ ...glass, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: dm.muted, fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#14b8a6'; e.currentTarget.style.borderColor = '#14b8a6'; }}
              onMouseLeave={e => { e.currentTarget.style.color = dm.muted; e.currentTarget.style.borderColor = dm.border; }}>
              <i className="bi bi-arrow-clockwise" style={{ fontSize: 14, animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}></i>
            </button>
            <div style={{ ...glass, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12 }}>
              <i className="bi bi-calendar3" style={{ color: '#14b8a6', fontSize: 14 }}></i>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: dm.text }}>{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div style={{ fontSize: '0.7rem', color: dm.muted }}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          </div>
        )}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: dm.muted }}>Updated {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <button onClick={fetchAll} style={{ ...glass, borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: dm.muted, fontFamily: 'inherit' }}>
              <i className="bi bi-arrow-clockwise" style={{ fontSize: 11, animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}></i>
            </button>
          </div>
        )}
      </div>

      {/* SparkLine Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 8 : 16, marginBottom: isMobile ? 12 : 20, background: darkMode ? 'linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a)' : 'linear-gradient(135deg, #0f2952, #14b8a6, #6366f1)', borderRadius: 18, padding: isMobile ? 10 : 16, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', boxSizing: 'border-box' }}>
        <SparkCard label="Total Products"     value={products.length}      icon="bi-box-seam"             color="#60a5fa" sparkData={genSparkData(products.length || 10)}       trend={12} sub="vs last month"   delay={0}   />
        <SparkCard label="Low Stock"          value={lowStockItems.length} icon="bi-exclamation-triangle" color="#f59e0b" sparkData={genSparkData(lowStockItems.length || 3)}   trend={-5} sub="needs attention" delay={100} />
        <SparkCard label="Today Transactions" value={todayTx.length}       icon="bi-arrow-left-right"     color="#14b8a6" sparkData={genSparkData(todayTx.length || 5, 10, 0.5)} trend={20} sub="vs yesterday"    delay={200} />
        <SparkCard label="Total Suppliers"    value={suppliers.length}     icon="bi-truck"                color="#a78bfa" sparkData={genSparkData(suppliers.length || 8)}        trend={8}  sub="active vendors"  delay={300} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: isMobile ? 10 : 14, marginBottom: isMobile ? 10 : 14, width: '100%', boxSizing: 'border-box' }}>

        {/* Stock Overview */}
        <div style={{ ...glass, borderRadius: 18, padding: isMobile ? 14 : 24, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h6 style={{ fontWeight: 700, margin: 0, color: dm.text, fontSize: '0.92rem' }}>Stock Overview</h6>
              <div style={{ fontSize: '0.72rem', color: dm.muted, marginTop: 2 }}>Stock In vs Stock Out activity</div>
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: dm.card2, borderRadius: 10, padding: 3, border: `1px solid ${dm.border}` }}>
                {[{ key: 'today', label: 'Today' }, { key: 'week', label: '7 Days' }, { key: 'month', label: '30 Days' }].map(r => (
                  <button key={r.key} onClick={() => setChartRange(r.key)}
                    style={{ padding: isMobile ? '3px 7px' : '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: isMobile ? 9 : 11, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s', background: chartRange === r.key ? 'linear-gradient(135deg,#14b8a6,#6366f1)' : 'transparent', color: chartRange === r.key ? '#fff' : dm.muted }}>
                    {r.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', background: dm.card2, borderRadius: 10, padding: 3, border: `1px solid ${dm.border}` }}>
                {[{ key: 'line', icon: 'bi-graph-up' }, { key: 'bar', icon: 'bi-bar-chart' }].map(t => (
                  <button key={t.key} onClick={() => setChartType(t.key)}
                    style={{ width: 28, height: 24, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: chartType === t.key ? 'linear-gradient(135deg,#14b8a6,#6366f1)' : 'transparent', color: chartType === t.key ? '#fff' : dm.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bi ${t.icon}`} style={{ fontSize: 10 }}></i>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ height: isMobile ? 160 : 220 }}>
            <Line data={chartData} options={chartOpts} />
          </div>
        </div>

        {/* Category Doughnut */}
        <div style={{ ...glass, borderRadius: 18, padding: isMobile ? 14 : 24, minWidth: 0 }}>
          <div style={{ marginBottom: 10 }}>
            <h6 style={{ fontWeight: 700, margin: 0, color: dm.text, fontSize: '0.92rem' }}>Category Distribution</h6>
            <div style={{ fontSize: '0.72rem', color: dm.muted, marginTop: 2 }}>{products.length} total products</div>
          </div>
          <div style={{ height: isMobile ? 130 : 160, position: 'relative' }}>
            {categories.length > 0 ? (
              <>
                <Doughnut data={doughnutData} options={doughnutOpts} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: dm.text, lineHeight: 1 }}>{products.length}</div>
                  <div style={{ fontSize: 10, color: dm.muted, marginTop: 2 }}>products</div>
                </div>
              </>
            ) : <div style={{ textAlign: 'center', color: dm.muted, paddingTop: 40 }}>No data</div>}
          </div>
          <div style={{ marginTop: 10 }}>
            {categories.map((cat, i) => {
              const count = products.filter(p => (p.category || 'General') === cat).length;
              const pct   = products.length ? Math.round(count / products.length * 100) : 0;
              const isHov = hoveredCat === cat;
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, padding: '3px 6px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', background: isHov ? dm.hover : 'transparent' }}
                  onMouseEnter={() => setHoveredCat(cat)} onMouseLeave={() => setHoveredCat(null)}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: catColors[i % catColors.length], flexShrink: 0 }} />
                  <span style={{ fontSize: '0.74rem', flex: 1, color: isHov ? dm.text : dm.muted, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: dm.text, flexShrink: 0 }}>{count}</span>
                  <span style={{ fontSize: '0.68rem', color: dm.muted, minWidth: 28, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: isMobile ? 10 : 14, marginBottom: isMobile ? 10 : 14, width: '100%', boxSizing: 'border-box' }}>

        {/* Recent Transactions */}
        <div style={{ ...glass, borderRadius: 18, padding: isMobile ? 14 : 24, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h6 style={{ fontWeight: 700, margin: 0, color: dm.text, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-clock-history" style={{ color: '#14b8a6' }}></i>Recent Transactions
            </h6>
            <button onClick={() => { setShowAllTx(true); setTxSearch(''); setTxFilter('all'); setTxPage(1); }}
              style={{ background: 'linear-gradient(135deg,#14b8a6,#6366f1)', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
              View All →
            </button>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 400 }}>
              <thead>
                <tr style={{ background: dm.card2 }}>
                  {['Product', 'Type', 'Qty', 'Total', 'Date'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '0.66rem', fontWeight: 700, color: dm.muted, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${dm.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: dm.muted }}>No transactions yet</td></tr>
                ) : transactions.slice(0, 5).map((t, i) => (
                  <tr key={t.id}
                    style={{ borderBottom: `1px solid ${dm.border}`, borderLeft: `3px solid ${t.type === 'in' ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = dm.hover; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* ✅ Product image */}
                        <DashProductAvatar product={{ id: t.product_id, name: t.product_name }} index={i} size={24} />
                        <span style={{ fontWeight: 600, color: dm.text, whiteSpace: 'nowrap' }}>{t.product_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, background: t.type === 'in' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: t.type === 'in' ? '#10b981' : '#ef4444', border: `1px solid ${t.type === 'in' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, whiteSpace: 'nowrap' }}>
                        <i className={`bi bi-arrow-${t.type === 'in' ? 'down' : 'up'}`} style={{ fontSize: 8 }}></i>
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: dm.text }}>{t.quantity}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: t.type === 'in' ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>${parseFloat(t.total_price || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', color: dm.muted, fontSize: '0.74rem', whiteSpace: 'nowrap' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div style={{ ...glass, borderRadius: 18, padding: isMobile ? 14 : 24, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h6 style={{ fontWeight: 700, margin: 0, color: dm.text, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-exclamation-triangle" style={{ color: '#f59e0b' }}></i>Low Stock Alert
            </h6>
            {lowStockItems.length > 0 && (
              <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>
                {lowStockItems.length} items
              </span>
            )}
          </div>
          {lowStockItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: dm.muted, padding: '20px 0' }}>
              <i className="bi bi-check-circle" style={{ fontSize: 28, display: 'block', marginBottom: 6, color: '#10b981' }}></i>
              <div style={{ fontSize: '0.83rem', fontWeight: 500 }}>All stock levels OK!</div>
            </div>
          ) : lowStockItems.map(p => {
            const isOut  = p.quantity === 0;
            const pct    = Math.min(100, Math.round(p.quantity / Math.max(p.min_quantity, 1) * 100));
            const barClr = isOut ? '#ef4444' : '#f59e0b';
            return (
              <div key={p.id} style={{ padding: '9px 10px', borderRadius: 10, marginBottom: 7, background: isOut ? (darkMode ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)') : (darkMode ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)'), border: `1px solid ${isOut ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`, boxSizing: 'border-box', transition: 'transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    {/* ✅ Product image in low stock */}
                    <DashProductAvatar product={p} index={p.id % 8} size={28} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: dm.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: '0.66rem', color: dm.muted, marginTop: 1 }}>Min: {p.min_quantity}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: barClr, lineHeight: 1 }}>{p.quantity}</div>
                      <span style={{ fontSize: '0.58rem', padding: '1px 6px', borderRadius: 20, fontWeight: 700, background: barClr, color: '#fff', whiteSpace: 'nowrap' }}>{isOut ? 'Out' : 'Low'}</span>
                    </div>
                    <button title="Reorder"
                      style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${dm.border}`, background: 'transparent', color: dm.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, transition: 'all 0.15s', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#14b8a6,#6366f1)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = '1px solid transparent'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dm.muted; e.currentTarget.style.border = `1px solid ${dm.border}`; }}>
                      <i className="bi bi-cart-plus"></i>
                    </button>
                  </div>
                </div>
                <div style={{ height: 3, borderRadius: 10, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 10, background: barClr, transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ fontSize: 9, color: dm.muted, marginTop: 2, textAlign: 'right' }}>{pct}% of minimum</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extra Row: Top Products + Top Suppliers */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 10 : 14, marginBottom: 12, width: '100%', boxSizing: 'border-box' }}>

        {/* Top Products by Value */}
        <div style={{ ...glass, borderRadius: 18, padding: isMobile ? 14 : 24, minWidth: 0 }}>
          <h6 style={{ fontWeight: 700, margin: '0 0 12px', color: dm.text, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-trophy" style={{ color: '#f59e0b' }}></i>Top Products by Value
          </h6>
          {[...products].sort((a, b) => (b.quantity * parseFloat(b.unit_price || 0)) - (a.quantity * parseFloat(a.unit_price || 0))).slice(0, 5).map((p, i) => {
            const val    = p.quantity * parseFloat(p.unit_price || 0);
            const maxVal = products.reduce((m, x) => Math.max(m, x.quantity * parseFloat(x.unit_price || 0)), 1);
            const pct    = Math.round(val / maxVal * 100);
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : dm.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: i < 3 ? '#fff' : dm.muted, flexShrink: 0, border: `1px solid ${dm.border}` }}>{i + 1}</div>
                {/* ✅ Product image in top products */}
                <DashProductAvatar product={p} index={i} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 11, color: dm.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ height: 3, borderRadius: 10, background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', marginTop: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 10, background: 'linear-gradient(90deg,#14b8a6,#6366f1)', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#14b8a6', flexShrink: 0 }}>${val.toFixed(0)}</div>
              </div>
            );
          })}
        </div>

        {/* Top Suppliers */}
        <div style={{ ...glass, borderRadius: 18, padding: isMobile ? 14 : 24, minWidth: 0 }}>
          <h6 style={{ fontWeight: 700, margin: '0 0 12px', color: dm.text, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-building" style={{ color: '#6366f1' }}></i>Top Suppliers
          </h6>
          {topSuppliers.length === 0 ? (
            <div style={{ textAlign: 'center', color: dm.muted, padding: '16px 0', fontSize: 12 }}>No supplier data</div>
          ) : topSuppliers.map((s, i) => {
            const maxTx = topSuppliers[0]?.txCount || 1;
            const pct   = Math.round(s.txCount / maxTx * 100);
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 11, color: dm.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  <div style={{ height: 3, borderRadius: 10, background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', marginTop: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 10, background: 'linear-gradient(90deg,#6366f1,#ec4899)', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
                <span style={{ fontSize: 10, color: dm.muted, flexShrink: 0 }}>{s.txCount} tx</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Transactions Modal */}
      {showAllTx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 10 : 20 }}>
          <div style={{ ...glass, borderRadius: isMobile ? 14 : 24, width: isMobile ? '100%' : 'min(800px,95vw)', maxHeight: isMobile ? '94vh' : '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>

            <div style={{ padding: isMobile ? '12px 14px' : '20px 24px', borderBottom: `1px solid ${dm.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dm.card2, borderRadius: isMobile ? '14px 14px 0 0' : '24px 24px 0 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#14b8a6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-clock-history" style={{ color: '#fff', fontSize: 12 }}></i>
                </div>
                <div>
                  <h5 style={{ margin: 0, fontWeight: 700, color: dm.text, fontSize: 13 }}>All Transactions</h5>
                  <div style={{ fontSize: 10, color: dm.muted }}><span style={{ fontWeight: 600, color: '#14b8a6' }}>{filteredTx.length}</span> / {transactions.length}</div>
                </div>
              </div>
              <button onClick={() => setShowAllTx(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: dm.muted, fontSize: 22 }}>
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div style={{ padding: isMobile ? '8px 12px' : '12px 24px', borderBottom: `1px solid ${dm.border}`, background: dm.card2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 120 }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: dm.muted, fontSize: 10, pointerEvents: 'none' }}></i>
                <input style={{ background: dm.card, border: `1px solid ${dm.border}`, color: dm.text, borderRadius: 9, padding: '6px 10px 6px 28px', width: '100%', outline: 'none', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
                  placeholder="Search..." value={txSearch} onChange={e => { setTxSearch(e.target.value); setTxPage(1); }} />
              </div>
              <div style={{ display: 'flex', background: dm.card, borderRadius: 9, padding: 3, border: `1px solid ${dm.border}`, gap: 2 }}>
                {[
                  { key: 'all', label: 'All', count: transactions.length },
                  { key: 'in',  label: 'IN',  count: transactions.filter(t => t.type === 'in').length },
                  { key: 'out', label: 'OUT', count: transactions.filter(t => t.type === 'out').length },
                ].map(tab => (
                  <button key={tab.key} onClick={() => { setTxFilter(tab.key); setTxPage(1); }}
                    style={{ padding: '4px 9px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s', background: txFilter === tab.key ? 'linear-gradient(135deg,#14b8a6,#6366f1)' : 'transparent', color: txFilter === tab.key ? '#fff' : dm.muted }}>
                    {tab.label} <span style={{ fontSize: 9, opacity: 0.8 }}>{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowY: 'auto', overflowX: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr style={{ background: dm.card2 }}>
                    {['#', 'Product', 'Type', 'Qty', 'Total', 'Note', 'Date'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', fontSize: 9, fontWeight: 700, color: dm.muted, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${dm.border}`, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedTx.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: dm.muted }}>
                      <i className="bi bi-inbox" style={{ fontSize: 28, display: 'block', marginBottom: 6, opacity: 0.3 }}></i>No transactions found
                    </td></tr>
                  ) : paginatedTx.map((t, i) => {
                    const rowIdx = (txPage - 1) * TX_PAGE_SIZE + i;
                    return (
                      <tr key={t.id}
                        style={{ borderBottom: `1px solid ${dm.border}`, borderLeft: `3px solid ${t.type === 'in' ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = dm.hover; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '9px 12px', fontSize: 10, color: dm.muted, fontFamily: 'monospace' }}>{rowIdx + 1}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {/* ✅ Product image in modal */}
                            <DashProductAvatar product={{ id: t.product_id, name: t.product_name }} index={rowIdx} size={24} />
                            <span style={{ fontWeight: 600, fontSize: 12, color: dm.text, whiteSpace: 'nowrap' }}>{t.product_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: t.type === 'in' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: t.type === 'in' ? '#10b981' : '#ef4444', border: `1px solid ${t.type === 'in' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                            <i className={`bi bi-arrow-${t.type === 'in' ? 'down' : 'up'}`} style={{ fontSize: 8 }}></i>{t.type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', fontWeight: 700, fontSize: 12, color: dm.text }}>{t.quantity}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 700, fontSize: 12, color: t.type === 'in' ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>${parseFloat(t.total_price || 0).toFixed(2)}</td>
                        <td style={{ padding: '9px 12px', fontSize: 11, color: dm.muted, maxWidth: 100 }}>
                          <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.note || '—'}</span>
                        </td>
                        <td style={{ padding: '9px 12px', fontSize: 11, color: dm.muted, whiteSpace: 'nowrap' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: isMobile ? '8px 12px' : '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${dm.border}`, background: dm.card2, borderRadius: isMobile ? '0 0 14px 14px' : '0 0 24px 24px', flexShrink: 0, flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: 10, color: dm.muted }}>
                <span style={{ fontWeight: 600, color: dm.text }}>{filteredTx.length === 0 ? 0 : (txPage - 1) * TX_PAGE_SIZE + 1}</span>–<span style={{ fontWeight: 600, color: dm.text }}>{Math.min(txPage * TX_PAGE_SIZE, filteredTx.length)}</span> of <span style={{ fontWeight: 600, color: dm.text }}>{filteredTx.length}</span>
              </span>
              <div style={{ display: 'flex', gap: 3 }}>
                <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
                  style={{ border: `1px solid ${dm.border}`, background: dm.card, borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: txPage === 1 ? 'not-allowed' : 'pointer', color: txPage === 1 ? dm.muted : dm.text }}>
                  <i className="bi bi-chevron-left" style={{ fontSize: 9 }}></i>
                </button>
                {Array.from({ length: Math.min(isMobile ? 3 : 5, txTotalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(txPage - 1, txTotalPages - (isMobile ? 2 : 4))) + i;
                  if (p < 1 || p > txTotalPages) return null;
                  const isActive = p === txPage;
                  return (
                    <button key={p} onClick={() => setTxPage(p)}
                      style={{ border: `1px solid ${isActive ? 'transparent' : dm.border}`, background: isActive ? 'linear-gradient(135deg,#14b8a6,#6366f1)' : dm.card, color: isActive ? '#fff' : dm.muted, borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: isActive ? 700 : 400, fontSize: 11 }}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))} disabled={txPage === txTotalPages || txTotalPages === 0}
                  style={{ border: `1px solid ${dm.border}`, background: dm.card, borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (txPage === txTotalPages || txTotalPages === 0) ? 'not-allowed' : 'pointer', color: (txPage === txTotalPages || txTotalPages === 0) ? dm.muted : dm.text }}>
                  <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 8, color: dm.muted, fontSize: '0.7rem' }}>
        © 2026 StockPro — Version 1.0.0 — Made with ❤️
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.4)}}`}</style>
    </div>
  );
}