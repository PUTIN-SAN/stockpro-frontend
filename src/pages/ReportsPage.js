import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const BASE_URL = 'https://stockpro-backend-production-8344.up.railway.app';

// ✅ Product image helper
const getProductImage = (id) => localStorage.getItem(`productImg_${id}`) || null;

export default function ReportsPage({ darkMode }) {
  const [products, setProducts]         = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('overview');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [windowWidth, setWindowWidth]   = useState(window.innerWidth);

  const [search, setSearch]                 = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType]         = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]     = useState('');

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth < 1024;

  useEffect(() => {
    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${BASE_URL}/api/products`,             { headers }).then(r => r.json()),
      fetch(`${BASE_URL}/api/transactions`,         { headers }).then(r => r.json()),
      fetch(`${BASE_URL}/api/transactions/summary`, { headers }).then(r => r.json()),
    ]).then(([p, t, s]) => {
      if (Array.isArray(p)) setProducts(p);
      if (Array.isArray(t)) setTransactions(t);
      if (s) setSummary(s);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(products.map(p => p.category || 'General'))];

  const filteredTx = transactions.filter(t => {
    const matchSearch = search ? t.product_name?.toLowerCase().includes(search.toLowerCase()) : true;
    const matchType   = filterType ? t.type === filterType : true;
    const txDate      = new Date(t.created_at);
    const matchFrom   = filterDateFrom ? txDate >= new Date(filterDateFrom) : true;
    const matchTo     = filterDateTo   ? txDate <= new Date(filterDateTo + 'T23:59:59') : true;
    return matchSearch && matchType && matchFrom && matchTo;
  });

  const filteredProducts = products.filter(p => {
    const matchSearch   = search ? p.name.toLowerCase().includes(search.toLowerCase()) : true;
    const matchCategory = filterCategory ? (p.category || 'General') === filterCategory : true;
    return matchSearch && matchCategory;
  });

  const lowStock = filteredProducts.filter(p => p.quantity <= p.min_quantity);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const inData  = last7Days.map(day => transactions.filter(t => t.type === 'in'  && new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === day).reduce((s, t) => s + t.quantity, 0));
  const outData = last7Days.map(day => transactions.filter(t => t.type === 'out' && new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === day).reduce((s, t) => s + t.quantity, 0));

  const barData = {
    labels: last7Days,
    datasets: [
      { label: 'Stock IN',  data: inData,  backgroundColor: '#00c9a7', borderRadius: 6 },
      { label: 'Stock OUT', data: outData, backgroundColor: '#e74c4c', borderRadius: 6 },
    ],
  };

  const doughnutData = {
    labels: categories,
    datasets: [{
      data: categories.map(c => products.filter(p => (p.category || 'General') === c).length),
      backgroundColor: ['#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#0ea5e9'],
      borderWidth: 0,
    }],
  };

  const stockBarData = {
    labels: products.map(p => p.name),
    datasets: [{
      label: 'Stock',
      data: products.map(p => p.quantity),
      backgroundColor: products.map(p => p.quantity <= p.min_quantity ? '#ef4444' : '#14b8a6'),
      borderRadius: 6,
    }],
  };

  const inAmount  = parseFloat(summary?.total_in_amount  || 0);
  const outAmount = parseFloat(summary?.total_out_amount || 0);
  const profit    = outAmount - inAmount;

  const totalInFiltered  = filteredTx.filter(t => t.type === 'in').reduce((s, t)  => s + parseFloat(t.total_price || 0), 0);
  const totalOutFiltered = filteredTx.filter(t => t.type === 'out').reduce((s, t) => s + parseFloat(t.total_price || 0), 0);
  const netFiltered      = totalOutFiltered - totalInFiltered;

  const chartOpts = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { color: darkMode ? '#94a3b8' : '#6b7fa8', boxWidth: 10, padding: 10, font: { size: 10 } } } },
    maintainAspectRatio: false,
  };

  const resetFilters = () => { setSearch(''); setFilterCategory(''); setFilterType(''); setFilterDateFrom(''); setFilterDateTo(''); };

  const dm = {
    bg:     darkMode ? '#060d1a' : '#f1f5f9',
    card:   darkMode ? 'rgba(15,23,42,0.9)'  : 'rgba(255,255,255,0.85)',
    card2:  darkMode ? 'rgba(13,18,35,0.95)' : 'rgba(248,250,252,0.9)',
    border: darkMode ? 'rgba(51,65,85,0.6)'  : 'rgba(226,232,240,0.8)',
    text:   darkMode ? '#f1f5f9' : '#0f172a',
    muted:  darkMode ? '#64748b' : '#64748b',
    input:  darkMode ? 'rgba(13,18,35,0.8)'  : 'rgba(255,255,255,0.9)',
    hover:  darkMode ? 'rgba(20,184,166,0.08)' : 'rgba(20,184,166,0.04)',
  };

  const glass = {
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    background: dm.card, border: `1px solid ${dm.border}`,
    boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(15,23,42,0.08)',
  };

  const inp = {
    background: dm.input, border: `1px solid ${dm.border}`,
    color: dm.text, borderRadius: 10, padding: '8px 12px',
    outline: 'none', fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.2s',
  };

  // ✅ Beautiful Invoice Print — matching the template screenshot
  const printInvoice = (inv) => {
    const productImg = inv.product_id ? getProductImage(inv.product_id) : null;
    const invoiceNo  = inv.invoice_number || `INV-${String(inv.id).padStart(4, '0')}`;
    const user       = JSON.parse(localStorage.getItem('user') || '{}');

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${invoiceNo}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #0f172a; }
          .page { background: #fff; max-width: 720px; margin: 0 auto; padding: 0; box-shadow: 0 4px 40px rgba(0,0,0,0.10); min-height: 100vh; }

          /* Header */
          .header { background: linear-gradient(135deg, #14b8a6 0%, #6366f1 100%); padding: 36px 44px 28px; color: #fff; display: flex; justify-content: space-between; align-items: flex-start; }
          .brand { display: flex; align-items: center; gap: 12px; }
          .brand-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 2px solid rgba(255,255,255,0.3); }
          .brand-name { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          .brand-sub { font-size: 11px; opacity: 0.75; margin-top: 2px; font-weight: 400; }
          .inv-title { text-align: right; }
          .inv-word { font-size: 32px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; opacity: 0.9; }
          .inv-num { font-size: 14px; font-weight: 700; font-family: monospace; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; margin-top: 8px; display: inline-block; }
          .inv-date { font-size: 11px; opacity: 0.75; margin-top: 6px; }

          /* Status banner */
          .status-bar { padding: 10px 44px; display: flex; align-items: center; gap: 10; }
          .status-badge { padding: 5px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
          .status-in  { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .status-out { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

          /* Info section */
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 1px solid #e2e8f0; }
          .info-box { padding: 24px 44px; }
          .info-box:first-child { border-right: 1px solid #e2e8f0; }
          .info-label { font-size: 9px; font-weight: 700; color: #14b8a6; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
          .info-name { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
          .info-detail { font-size: 12px; color: #64748b; line-height: 1.8; }

          /* Product section */
          .product-section { padding: 24px 44px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 20px; background: #f8fafc; }
          .product-img { width: 70px; height: 70px; border-radius: 14px; object-fit: cover; border: 2px solid #e2e8f0; }
          .product-placeholder { width: 70px; height: 70px; border-radius: 14px; background: linear-gradient(135deg,#14b8a6,#6366f1); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: #fff; flex-shrink: 0; }
          .product-name { font-size: 16px; font-weight: 700; color: #0f172a; }
          .product-meta { font-size: 12px; color: #64748b; margin-top: 4px; }

          /* Table */
          .table-section { padding: 0 44px; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0; }
          thead th { background: #f1f5f9; padding: 11px 14px; text-align: left; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 2px solid #e2e8f0; }
          thead th:last-child { text-align: right; }
          tbody td { padding: 14px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; }
          tbody td:last-child { text-align: right; font-weight: 700; }
          tbody tr:last-child td { border-bottom: none; }

          /* Totals */
          .total-section { padding: 0 44px 32px; display: flex; justify-content: flex-end; }
          .total-box { width: 280px; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
          .total-row { display: flex; justify-content: space-between; padding: 11px 18px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; }
          .total-row span:last-child { font-family: monospace; font-weight: 600; color: #0f172a; }
          .total-final { display: flex; justify-content: space-between; padding: 16px 18px; font-size: 16px; font-weight: 800; background: linear-gradient(135deg, #14b8a6, #6366f1); color: #fff; }
          .total-final span:last-child { font-family: monospace; }

          /* Footer */
          .footer { background: #f8fafc; border-top: 2px solid #e2e8f0; padding: 20px 44px; display: flex; justify-content: space-between; align-items: center; }
          .footer-brand { font-size: 12px; font-weight: 700; color: #14b8a6; }
          .footer-note  { font-size: 11px; color: #94a3b8; }

          @media print {
            body { background: #fff; }
            .page { box-shadow: none; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <div class="brand">
              <div class="brand-icon">📦</div>
              <div>
                <div class="brand-name">StockPro</div>
                <div class="brand-sub">Management System</div>
              </div>
            </div>
            <div class="inv-title">
              <div class="inv-word">Invoice</div>
              <div class="inv-num">${invoiceNo}</div>
              <div class="inv-date">📅 ${new Date(inv.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>

          <!-- Status bar -->
          <div class="status-bar" style="padding: 14px 44px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; background: ${inv.type === 'in' ? '#f0fdf4' : '#fff5f5'}">
            <span class="status-badge ${inv.type === 'in' ? 'status-in' : 'status-out'}">
              ${inv.type === 'in' ? '▼ STOCK IN' : '▲ STOCK OUT'}
            </span>
            <span style="font-size: 12px; color: #64748b;">Transaction recorded on ${new Date(inv.created_at).toLocaleString()}</span>
          </div>

          <!-- Info Grid -->
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">📋 Invoice Details</div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; gap: 8px; font-size: 12px;">
                  <span style="color: #64748b; width: 90px;">Invoice No:</span>
                  <span style="font-weight: 700; font-family: monospace; color: #14b8a6;">${invoiceNo}</span>
                </div>
                <div style="display: flex; gap: 8px; font-size: 12px;">
                  <span style="color: #64748b; width: 90px;">Date:</span>
                  <span style="font-weight: 600;">${new Date(inv.created_at).toLocaleDateString()}</span>
                </div>
                <div style="display: flex; gap: 8px; font-size: 12px;">
                  <span style="color: #64748b; width: 90px;">Type:</span>
                  <span style="font-weight: 700; color: ${inv.type === 'in' ? '#10b981' : '#ef4444'};">${inv.type.toUpperCase()}</span>
                </div>
                <div style="display: flex; gap: 8px; font-size: 12px;">
                  <span style="color: #64748b; width: 90px;">Recorded by:</span>
                  <span style="font-weight: 600;">${user.name || 'Admin'}</span>
                </div>
              </div>
            </div>
            <div class="info-box">
              <div class="info-label">🏢 Company</div>
              <div class="info-name">StockPro Co., Ltd.</div>
              <div class="info-detail">
                Stock Management System<br>
                📧 admin@stockpro.com<br>
                📞 +855 12 345 678
              </div>
            </div>
          </div>

          <!-- Product Info -->
          <div class="product-section">
            ${productImg
              ? `<img src="${productImg}" class="product-img" alt="${inv.product_name}" />`
              : `<div class="product-placeholder">${(inv.product_name || '??').slice(0, 2).toUpperCase()}</div>`
            }
            <div>
              <div class="product-name">${inv.product_name}</div>
              <div class="product-meta">Product code: PRD-${String(inv.product_id || 0).padStart(3, '0')}</div>
            </div>
          </div>

          <!-- Table -->
          <div class="table-section">
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Description</th>
                  <th style="width: 80px; text-align: center;">Qty</th>
                  <th style="width: 120px; text-align: right;">Unit Price</th>
                  <th style="width: 120px;">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color: #94a3b8;">1</td>
                  <td>
                    <div style="font-weight: 600;">${inv.product_name}</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                      ${inv.type === 'in' ? 'Stock received into inventory' : 'Stock issued from inventory'}
                    </div>
                  </td>
                  <td style="text-align: center; font-family: monospace; font-weight: 700;">${inv.quantity}</td>
                  <td style="text-align: right; font-family: monospace; color: #64748b;">$${parseFloat(inv.unit_price || 0).toFixed(2)}</td>
                  <td style="font-family: monospace; font-weight: 800; color: ${inv.type === 'in' ? '#ef4444' : '#10b981'};">
                    $${parseFloat(inv.total_price || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div class="total-section">
            <div class="total-box">
              <div class="total-row">
                <span>Subtotal</span>
                <span>$${parseFloat(inv.total_price || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Tax (0%)</span>
                <span>$0.00</span>
              </div>
              <div class="total-final">
                <span>TOTAL</span>
                <span>$${parseFloat(inv.total_price || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div>
              <div class="footer-brand">📦 StockPro Management System</div>
              <div class="footer-note">Thank you for using StockPro • Generated ${new Date().toLocaleString()}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; color: #94a3b8;">Version 1.0.0</div>
            </div>
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(20,184,166,0.2)', borderTop: '3px solid #14b8a6', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: dm.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontWeight: 800, margin: 0, color: dm.text, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>Reports</h4>
        <div style={{ fontSize: 12, color: dm.muted, marginTop: 2 }}>
          Dashboard <i className="bi bi-chevron-right" style={{ fontSize: 9, margin: '0 4px' }}></i>
          <span style={{ color: dm.text }}>Reports & Analytics</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Stock IN Value',  value: `$${inAmount.toFixed(2)}`,  icon: 'bi-arrow-down-circle', grad: 'linear-gradient(135deg,#10b981,#14b8a6)', glow: 'rgba(16,185,129,0.3)', sub: `${summary?.total_in_qty  || 0} units` },
          { label: 'Stock OUT Value', value: `$${outAmount.toFixed(2)}`, icon: 'bi-arrow-up-circle',   grad: 'linear-gradient(135deg,#ef4444,#f97316)', glow: 'rgba(239,68,68,0.3)',  sub: `${summary?.total_out_qty || 0} units` },
          { label: 'Net Profit',      value: `$${profit.toFixed(2)}`,    icon: 'bi-cash-stack',         grad: profit >= 0 ? 'linear-gradient(135deg,#14b8a6,#6366f1)' : 'linear-gradient(135deg,#f59e0b,#ef4444)', glow: 'rgba(20,184,166,0.3)', sub: 'Revenue estimate' },
          { label: 'Transactions',    value: summary?.total_transactions || 0, icon: 'bi-receipt',     grad: 'linear-gradient(135deg,#6366f1,#ec4899)', glow: 'rgba(99,102,241,0.3)', sub: 'All time' },
        ].map((c, i) => (
          <div key={i} style={{ ...glass, borderRadius: 16, padding: isMobile ? '12px' : '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${c.glow}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(15,23,42,0.08)'; }}>
            <div>
              <div style={{ fontSize: isMobile ? 9 : 10, color: dm.muted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{c.label}</div>
              <div style={{ fontSize: isMobile ? 14 : typeof c.value === 'string' && c.value.length > 6 ? 16 : 22, fontWeight: 800, color: dm.text, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 10, color: dm.muted, marginTop: 3 }}>{c.sub}</div>
            </div>
            <div style={{ width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: isMobile ? 10 : 12, background: c.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 16 : 18, color: '#fff', boxShadow: `0 4px 15px ${c.glow}`, flexShrink: 0 }}>
              <i className={`bi ${c.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{ ...glass, borderRadius: 14, padding: '12px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8, alignItems: isMobile ? 'stretch' : 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: isMobile ? 'none' : 1, minWidth: isMobile ? 'auto' : 180 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: dm.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Search</label>
            <i className="bi bi-search" style={{ position: 'absolute', left: 10, bottom: 10, color: dm.muted, fontSize: 13, pointerEvents: 'none' }}></i>
            <input style={{ ...inp, paddingLeft: 32, width: '100%' }} placeholder="Product name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ minWidth: isMobile ? 'auto' : 140 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: dm.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Category</label>
            <select style={{ ...inp, width: '100%' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ minWidth: isMobile ? 'auto' : 130 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: dm.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Type</label>
            <select style={{ ...inp, width: '100%' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="in">Stock IN</option>
              <option value="out">Stock OUT</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6, flex: isMobile ? 'none' : 1, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: dm.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>From</label>
              <input type="date" style={{ ...inp, width: '100%' }} value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: dm.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>To</label>
              <input type="date" style={{ ...inp, width: '100%' }} value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
            <button style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#14b8a6,#6366f1)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(20,184,166,0.3)', whiteSpace: 'nowrap' }}
              onClick={() => setActiveTab('invoice')}>
              <i className="bi bi-search"></i>{!isMobile && 'Search'}
            </button>
            <button style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${dm.border}`, background: 'transparent', color: dm.muted, fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }} onClick={resetFilters}>
              <i className="bi bi-x-circle"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ overflowX: 'auto', marginBottom: 14, WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', gap: 3, minWidth: 'max-content', padding: '6px', background: dm.card2, borderRadius: 12, border: `1px solid ${dm.border}`, backdropFilter: 'blur(20px)', width: 'fit-content' }}>
          {[
            { key: 'overview',     label: isMobile ? '📊' : 'Overview Charts' },
            { key: 'invoice',      label: `Invoice (${filteredTx.length})` },
            { key: 'transactions', label: `${isMobile ? 'Tx' : 'Transactions'} (${filteredTx.length})` },
            { key: 'stock',        label: `Stock (${filteredProducts.length})` },
            { key: 'lowstock',     label: `⚠️ Low (${lowStock.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: isMobile ? '7px 12px' : '7px 16px', borderRadius: 8, fontSize: isMobile ? 11 : 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap', background: activeTab === tab.key ? 'linear-gradient(135deg,#14b8a6,#6366f1)' : 'transparent', color: activeTab === tab.key ? '#fff' : dm.muted, boxShadow: activeTab === tab.key ? '0 4px 12px rgba(20,184,166,0.3)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Overview Charts */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '2fr 1fr', gap: 14 }}>
            <div style={{ ...glass, borderRadius: 18, padding: 22 }}>
              <h6 style={{ fontWeight: 700, margin: '0 0 16px', color: dm.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="bi bi-bar-chart" style={{ color: '#14b8a6' }}></i>Stock IN vs OUT (Last 7 Days)
              </h6>
              <div style={{ height: isMobile ? 180 : 240 }}>
                <Bar data={barData} options={{ ...chartOpts, scales: { x: { ticks: { color: dm.muted, font: { size: 10 } }, grid: { color: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' } }, y: { ticks: { color: dm.muted, font: { size: 10 } }, grid: { color: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, beginAtZero: true } } }} />
              </div>
            </div>
            <div style={{ ...glass, borderRadius: 18, padding: 22 }}>
              <h6 style={{ fontWeight: 700, margin: '0 0 16px', color: dm.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="bi bi-pie-chart" style={{ color: '#6366f1' }}></i>By Category
              </h6>
              <div style={{ height: isMobile ? 160 : 200 }}>
                {categories.length > 0
                  ? <Doughnut data={doughnutData} options={{ ...chartOpts, cutout: '65%', plugins: { legend: { position: isMobile ? 'bottom' : 'right', labels: { color: dm.muted, boxWidth: 8, padding: 8, font: { size: 10 } } } } }} />
                  : <div style={{ textAlign: 'center', color: dm.muted, paddingTop: 40 }}>No data</div>
                }
              </div>
            </div>
          </div>
          <div style={{ ...glass, borderRadius: 18, padding: 22 }}>
            <h6 style={{ fontWeight: 700, margin: '0 0 16px', color: dm.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="bi bi-boxes" style={{ color: '#14b8a6' }}></i>Current Stock Level
              <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>🔴 Low Stock</span>
            </h6>
            <div style={{ height: isMobile ? 160 : 220 }}>
              <Bar data={stockBarData} options={{ ...chartOpts, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: dm.muted, font: { size: isMobile ? 9 : 10 }, maxRotation: isMobile ? 45 : 0 }, grid: { display: false } }, y: { ticks: { color: dm.muted, font: { size: 10 } }, grid: { color: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, beginAtZero: true } } }} />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Invoice */}
      {activeTab === 'invoice' && (
        <div style={{ ...glass, borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: `1px solid ${dm.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dm.card2 }}>
            <h6 style={{ fontWeight: 700, margin: 0, color: dm.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="bi bi-receipt" style={{ color: '#14b8a6' }}></i>Invoice List ({filteredTx.length})
            </h6>
          </div>

          {/* ✅ Invoice Preview Modal — matching template */}
          {selectedInvoice && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <div style={{ ...glass, borderRadius: 24, width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>

                {/* Invoice Header */}
                <div style={{ background: 'linear-gradient(135deg,#14b8a6,#6366f1)', borderRadius: '24px 24px 0 0', padding: '28px 32px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '2px solid rgba(255,255,255,0.3)' }}>📦</div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>StockPro</div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Management System</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>Invoice</div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'monospace', marginTop: 4 }}>
                        {selectedInvoice.invoice_number || `INV-${String(selectedInvoice.id).padStart(4, '0')}`}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 }}>
                        {new Date(selectedInvoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status + Actions bar */}
                <div style={{ padding: '12px 28px', background: selectedInvoice.type === 'in' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', borderBottom: `1px solid ${dm.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: selectedInvoice.type === 'in' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: selectedInvoice.type === 'in' ? '#10b981' : '#ef4444', border: `1px solid ${selectedInvoice.type === 'in' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                    <i className={`bi bi-arrow-${selectedInvoice.type === 'in' ? 'down' : 'up'}-circle`}></i>
                    STOCK {selectedInvoice.type.toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => printInvoice(selectedInvoice)}
                      style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#14b8a6,#6366f1)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(20,184,166,0.3)' }}>
                      <i className="bi bi-printer"></i>Print
                    </button>
                    <button onClick={() => setSelectedInvoice(null)}
                      style={{ background: 'transparent', border: `1px solid ${dm.border}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: dm.muted, fontSize: 18 }}>
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                </div>

                <div style={{ padding: '20px 28px' }}>
                  {/* Product Preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 14, border: `1px solid ${dm.border}`, marginBottom: 20 }}>
                    {(() => {
                      const img = selectedInvoice.product_id ? getProductImage(selectedInvoice.product_id) : null;
                      return img
                        ? <img src={img} style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(20,184,166,0.3)' }} alt={selectedInvoice.product_name} />
                        : <div style={{ width: 60, height: 60, borderRadius: 12, background: 'linear-gradient(135deg,#14b8a6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {(selectedInvoice.product_name || '??').slice(0, 2).toUpperCase()}
                          </div>;
                    })()}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: dm.text }}>{selectedInvoice.product_name}</div>
                      <div style={{ fontSize: 11, color: dm.muted, marginTop: 3 }}>
                        PRD-{String(selectedInvoice.product_id || 0).padStart(3, '0')} • {new Date(selectedInvoice.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {[
                      { icon: 'bi-hash',       label: 'Quantity',   value: selectedInvoice.quantity,                                 color: '#6366f1' },
                      { icon: 'bi-tag',         label: 'Unit Price', value: `$${parseFloat(selectedInvoice.unit_price || 0).toFixed(2)}`,   color: '#f59e0b' },
                      { icon: 'bi-arrow-left-right', label: 'Type', value: selectedInvoice.type.toUpperCase(),                       color: selectedInvoice.type === 'in' ? '#10b981' : '#ef4444' },
                      { icon: 'bi-calendar3',  label: 'Date',       value: new Date(selectedInvoice.created_at).toLocaleDateString(), color: '#14b8a6' },
                    ].map((d, i) => (
                      <div key={i} style={{ padding: '12px 14px', background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 10, border: `1px solid ${dm.border}` }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: dm.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className={`bi ${d.icon}`} style={{ color: d.color, fontSize: 10 }}></i>{d.label}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: d.color }}>{d.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Total Box */}
                  <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${dm.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 18px', fontSize: 13, color: dm.muted, borderBottom: `1px solid ${dm.border}` }}>
                      <span>Subtotal</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: dm.text }}>${parseFloat(selectedInvoice.total_price || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 18px', fontSize: 13, color: dm.muted, borderBottom: `1px solid ${dm.border}` }}>
                      <span>Tax (0%)</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: dm.text }}>$0.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 18px', fontSize: 17, fontWeight: 800, background: 'linear-gradient(135deg,#14b8a6,#6366f1)', color: '#fff' }}>
                      <span>TOTAL</span>
                      <span style={{ fontFamily: 'monospace' }}>${parseFloat(selectedInvoice.total_price || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Table */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 600 : 700 }}>
              <thead>
                <tr style={{ background: dm.card2 }}>
                  {['Invoice #', 'Product', 'Type', 'Qty', 'Unit Price', 'Total', 'Date', 'Action'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', fontSize: 10, fontWeight: 700, color: dm.muted, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${dm.border}`, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTx.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: dm.muted }}>
                    <i className="bi bi-receipt" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.3 }}></i>No invoices found
                  </td></tr>
                ) : filteredTx.map(t => {
                  const img = t.product_id ? getProductImage(t.product_id) : null;
                  return (
                    <tr key={t.id}
                      style={{ borderBottom: `1px solid ${dm.border}`, cursor: 'pointer', transition: 'all 0.15s', borderLeft: '3px solid transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = dm.hover; e.currentTarget.style.borderLeft = '3px solid #14b8a6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = '3px solid transparent'; }}>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#14b8a6', background: 'rgba(20,184,166,0.1)', padding: '2px 7px', borderRadius: 6, border: '1px solid rgba(20,184,166,0.2)', whiteSpace: 'nowrap' }}>
                          {t.invoice_number || `INV-${String(t.id).padStart(4, '0')}`}
                        </span>
                      </td>
                      {/* ✅ Product with image */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: img ? 'none' : 'linear-gradient(135deg,#14b8a6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', border: img ? '1.5px solid rgba(20,184,166,0.3)' : 'none' }}>
                            {img ? <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (t.product_name || '??').slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: dm.text, fontSize: 12, whiteSpace: 'nowrap' }}>{t.product_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: t.type === 'in' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: t.type === 'in' ? '#10b981' : '#ef4444', border: `1px solid ${t.type === 'in' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                          <i className={`bi bi-arrow-${t.type === 'in' ? 'down' : 'up'}`} style={{ fontSize: 9 }}></i>{t.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', color: dm.text, fontSize: 12, fontFamily: 'monospace' }}>{t.quantity}</td>
                      <td style={{ padding: '11px 14px', color: dm.muted, fontSize: 12, fontFamily: 'monospace' }}>${parseFloat(t.unit_price || 0).toFixed(2)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontWeight: 800, color: t.type === 'out' ? '#10b981' : '#ef4444', fontFamily: 'monospace', fontSize: 13 }}>
                          ${parseFloat(t.total_price || 0).toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', color: dm.muted, fontSize: 11, whiteSpace: 'nowrap' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setSelectedInvoice(t)}
                            style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${dm.border}`, background: 'transparent', color: dm.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#14b8a6,#6366f1)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = '1px solid transparent'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dm.muted; e.currentTarget.style.border = `1px solid ${dm.border}`; }}>
                            <i className="bi bi-eye"></i>
                          </button>
                          <button onClick={() => printInvoice(t)}
                            style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${dm.border}`, background: 'transparent', color: dm.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#6366f1,#ec4899)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = '1px solid transparent'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dm.muted; e.currentTarget.style.border = `1px solid ${dm.border}`; }}>
                            <i className="bi bi-printer"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filteredTx.length > 0 && (
                <tfoot>
                  {[
                    { label: 'Total IN (Cost)',     value: totalInFiltered.toFixed(2),  color: '#ef4444' },
                    { label: 'Total OUT (Revenue)', value: totalOutFiltered.toFixed(2), color: '#10b981' },
                    { label: 'Net Profit',          value: netFiltered.toFixed(2),      color: netFiltered >= 0 ? '#14b8a6' : '#ef4444', bold: true },
                  ].map((row, i) => (
                    <tr key={i} style={row.bold ? { background: darkMode ? 'rgba(20,184,166,0.08)' : 'rgba(20,184,166,0.04)' } : {}}>
                      <td colSpan={5} style={{ padding: '9px 14px', textAlign: 'right', fontWeight: row.bold ? 800 : 600, color: dm.muted, fontSize: row.bold ? 13 : 12, borderTop: row.bold ? `2px solid ${dm.border}` : 'none' }}>{row.label}:</td>
                      <td style={{ padding: '9px 14px', fontWeight: row.bold ? 800 : 700, color: row.color, fontFamily: 'monospace', fontSize: row.bold ? 15 : 13 }}>${row.value}</td>
                      <td colSpan={2}></td>
                    </tr>
                  ))}
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tab: Transactions */}
      {activeTab === 'transactions' && (
        <div style={{ ...glass, borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: `1px solid ${dm.border}`, background: dm.card2 }}>
            <h6 style={{ fontWeight: 700, margin: 0, color: dm.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="bi bi-clock-history" style={{ color: '#14b8a6' }}></i>Transaction History ({filteredTx.length})
            </h6>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 500 : 600 }}>
              <thead>
                <tr style={{ background: dm.card2 }}>
                  {['#', 'Product', 'Type', 'Qty', 'Total', 'Note', 'Date'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', fontSize: 10, fontWeight: 700, color: dm.muted, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${dm.border}`, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTx.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '50px', color: dm.muted }}>No transactions found</td></tr>
                ) : filteredTx.map((t, i) => (
                  <tr key={t.id}
                    style={{ borderBottom: `1px solid ${dm.border}`, transition: 'all 0.15s', borderLeft: '3px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = dm.hover; e.currentTarget.style.borderLeft = '3px solid #14b8a6'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = '3px solid transparent'; }}>
                    <td style={{ padding: '10px 14px', color: dm.muted, fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {(() => {
                          const img = t.product_id ? getProductImage(t.product_id) : null;
                          return (
                            <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: img ? 'none' : 'linear-gradient(135deg,#14b8a6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                              {img ? <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (t.product_name || '??').slice(0, 2).toUpperCase()}
                            </div>
                          );
                        })()}
                        <span style={{ fontWeight: 600, color: dm.text, fontSize: 12 }}>{t.product_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: t.type === 'in' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: t.type === 'in' ? '#10b981' : '#ef4444', border: `1px solid ${t.type === 'in' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                        <i className={`bi bi-arrow-${t.type === 'in' ? 'down' : 'up'}`} style={{ fontSize: 9 }}></i>{t.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: dm.text, fontFamily: 'monospace' }}>{t.quantity}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: t.type === 'out' ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>${parseFloat(t.total_price || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', color: dm.muted, fontSize: 11, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note || '—'}</td>
                    <td style={{ padding: '10px 14px', color: dm.muted, fontSize: 11, whiteSpace: 'nowrap' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Stock Levels */}
      {activeTab === 'stock' && (
        <div style={{ ...glass, borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: `1px solid ${dm.border}`, background: dm.card2 }}>
            <h6 style={{ fontWeight: 700, margin: 0, color: dm.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="bi bi-boxes" style={{ color: '#14b8a6' }}></i>All Products ({filteredProducts.length})
            </h6>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 500 : 650 }}>
              <thead>
                <tr style={{ background: dm.card2 }}>
                  {['#', 'Product', 'Category', 'Stock', 'Min', 'Price', 'Value', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', fontSize: 10, fontWeight: 700, color: dm.muted, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${dm.border}`, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '50px', color: dm.muted }}>No products found</td></tr>
                ) : filteredProducts.map((p, i) => (
                  <tr key={p.id}
                    style={{ borderBottom: `1px solid ${dm.border}`, transition: 'all 0.15s', borderLeft: '3px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = dm.hover; e.currentTarget.style.borderLeft = '3px solid #14b8a6'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = '3px solid transparent'; }}>
                    <td style={{ padding: '10px 14px', color: dm.muted, fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {(() => {
                          const img = getProductImage(p.id);
                          return (
                            <div style={{ width: 30, height: 30, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: img ? 'none' : 'linear-gradient(135deg,#14b8a6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', border: img ? '1.5px solid rgba(20,184,166,0.3)' : 'none' }}>
                              {img ? <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : p.name.slice(0, 2).toUpperCase()}
                            </div>
                          );
                        })()}
                        <span style={{ fontWeight: 600, color: dm.text, fontSize: 12, whiteSpace: 'nowrap' }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: 'rgba(20,184,166,0.12)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.2)' }}>{p.category || 'General'}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: p.quantity <= p.min_quantity ? '#ef4444' : dm.text, fontFamily: 'monospace' }}>{p.quantity}</td>
                    <td style={{ padding: '10px 14px', color: dm.muted, fontFamily: 'monospace' }}>{p.min_quantity}</td>
                    <td style={{ padding: '10px 14px', color: dm.muted, fontFamily: 'monospace' }}>${parseFloat(p.unit_price || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#14b8a6', fontFamily: 'monospace' }}>${(p.quantity * parseFloat(p.unit_price || 0)).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: p.quantity <= p.min_quantity ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)', color: p.quantity <= p.min_quantity ? '#f59e0b' : '#10b981', border: `1px solid ${p.quantity <= p.min_quantity ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}` }}>
                        {p.quantity <= p.min_quantity ? '⚠️ Low' : '✅ OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredProducts.length > 0 && (
                <tfoot>
                  <tr style={{ background: darkMode ? 'rgba(20,184,166,0.06)' : 'rgba(20,184,166,0.04)' }}>
                    <td colSpan={6} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: dm.muted, borderTop: `1px solid ${dm.border}` }}>Total Stock Value:</td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#14b8a6', fontFamily: 'monospace', fontSize: 14, borderTop: `1px solid ${dm.border}` }}>
                      ${filteredProducts.reduce((s, p) => s + (p.quantity * parseFloat(p.unit_price || 0)), 0).toFixed(2)}
                    </td>
                    <td style={{ borderTop: `1px solid ${dm.border}` }}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tab: Low Stock */}
      {activeTab === 'lowstock' && (
        <div style={{ ...glass, borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: `1px solid ${dm.border}`, background: dm.card2 }}>
            <h6 style={{ fontWeight: 700, margin: 0, color: dm.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="bi bi-exclamation-triangle" style={{ color: '#f59e0b' }}></i>Low Stock Products ({lowStock.length})
            </h6>
          </div>
          {lowStock.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: dm.muted }}>
              <i className="bi bi-check-circle" style={{ fontSize: 40, display: 'block', marginBottom: 10, color: '#10b981' }}></i>
              <div style={{ fontWeight: 600, color: dm.text }}>All stock levels OK!</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 450 : 600 }}>
                <thead>
                  <tr style={{ background: dm.card2 }}>
                    {['#', 'Product', 'Category', 'Current', 'Min', 'Need', 'Est. Cost'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', fontSize: 10, fontWeight: 700, color: dm.muted, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${dm.border}`, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p, i) => (
                    <tr key={p.id}
                      style={{ borderBottom: `1px solid ${dm.border}`, transition: 'all 0.15s', borderLeft: '3px solid transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = dm.hover; e.currentTarget.style.borderLeft = '3px solid #f59e0b'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = '3px solid transparent'; }}>
                      <td style={{ padding: '10px 14px', color: dm.muted, fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {(() => {
                            const img = getProductImage(p.id);
                            return (
                              <div style={{ width: 30, height: 30, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: img ? 'none' : 'linear-gradient(135deg,#ef4444,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                                {img ? <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : p.name.slice(0, 2).toUpperCase()}
                              </div>
                            );
                          })()}
                          <span style={{ fontWeight: 700, color: '#ef4444', fontSize: 12, whiteSpace: 'nowrap' }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>{p.category || 'General'}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'monospace' }}>{p.quantity}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: dm.muted, fontFamily: 'monospace' }}>{p.min_quantity}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', fontFamily: 'monospace' }}>
                          +{p.min_quantity - p.quantity + 10}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
                        ${((p.min_quantity - p.quantity + 10) * parseFloat(p.unit_price || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}