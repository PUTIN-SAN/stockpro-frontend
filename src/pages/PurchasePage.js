import React, { useState, useEffect, useRef } from 'react';

const BASE_URL = 'http://localhost:5000';

const STATUS_CFG = {
  pending:   { color:'#f59e0b', glow:'rgba(245,158,11,0.4)',  grad:'linear-gradient(135deg,#f59e0b,#f97316)', label:'Pending'   },
  paid:      { color:'#10b981', glow:'rgba(16,185,129,0.4)',  grad:'linear-gradient(135deg,#10b981,#14b8a6)', label:'Paid'      },
  overdue:   { color:'#ef4444', glow:'rgba(239,68,68,0.4)',   grad:'linear-gradient(135deg,#ef4444,#f97316)', label:'Overdue'   },
  cancelled: { color:'#64748b', glow:'rgba(100,116,139,0.3)', grad:'linear-gradient(135deg,#64748b,#475569)', label:'Cancelled' },
};

const PAYMENT_ICONS = {
  cash:          '💵',
  bank_transfer: '🏦',
  cheque:        '📝',
  online:        '💳',
};

const PAYMENT_METHODS = ['cash','bank_transfer','cheque','online'];

// ── Responsive hook ──
function useBreakpoint() {
  const getBreakpoint = (w) => {
    if (w < 600)  return 'mobile';
    if (w < 900)  return 'tablet';
    if (w < 1200) return 'tabletLg';
    return 'desktop';
  };
  const [bp, setBp] = useState(getBreakpoint(window.innerWidth));
  useEffect(() => {
    const h = () => setBp(getBreakpoint(window.innerWidth));
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return {
    bp,
    isMobile:   bp === 'mobile',
    isTablet:   bp === 'tablet',
    isTabletLg: bp === 'tabletLg',
    isDesktop:  bp === 'desktop',
    isSmall:    bp === 'mobile' || bp === 'tablet',
  };
}

export default function PurchasePage({ darkMode }) {
  const { bp, isMobile, isTablet, isTabletLg, isSmall } = useBreakpoint();

  const [orders, setOrders]       = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]       = useState('');

  const [form, setForm] = useState({
    supplier_id:'', order_date:new Date().toISOString().slice(0,10),
    due_date:'', payment_method:'cash', shipping_cost:0, tax:0, note:'',
    items:[{ product_id:'', product_name:'', quantity:1, unit_price:0 }],
  });

  const token   = localStorage.getItem('token');
  const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };

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
    backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
    background: dm.card, border:`1px solid ${dm.border}`,
    boxShadow: darkMode?'0 8px 32px rgba(0,0,0,0.3)':'0 8px 32px rgba(15,23,42,0.08)',
    boxSizing: 'border-box',
  };

  const inp = {
    background:dm.input, border:`1px solid ${dm.border}`,
    color:dm.text, borderRadius:10, padding:'9px 13px',
    width:'100%', outline:'none', fontSize:'13px', fontFamily:'inherit',
    transition:'all 0.2s', boxSizing:'border-box',
  };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch(`${BASE_URL}/api/purchases`,  {headers}).then(r=>r.json()),
      fetch(`${BASE_URL}/api/suppliers`,  {headers}).then(r=>r.json()),
      fetch(`${BASE_URL}/api/products`,   {headers}).then(r=>r.json()),
    ]).then(([o,s,p])=>{
      if(Array.isArray(o)) setOrders(o);
      if(Array.isArray(s)) setSuppliers(s);
      if(Array.isArray(p)) setProducts(p);
    }).finally(()=>setLoading(false));
  };

  useEffect(()=>{ fetchAll(); },[]);

  const totalOrders  = orders.length;
  const totalPaid    = orders.filter(o=>o.status==='paid').length;
  const totalPending = orders.filter(o=>o.status==='pending').length;
  const totalOverdue = orders.filter(o=>o.status==='overdue').length;
  const totalAmount  = orders.reduce((s,o)=>s+parseFloat(o.total||0),0);
  const paidAmount   = orders.filter(o=>o.status==='paid').reduce((s,o)=>s+parseFloat(o.total||0),0);

  const filtered = orders.filter(o=>{
    const matchTab  = activeTab==='all' || o.status===activeTab;
    const matchSrch = search
      ? o.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        (o.supplier_name||'').toLowerCase().includes(search.toLowerCase())
      : true;
    return matchTab && matchSrch;
  });

  const addItem    = () => setForm(f=>({...f,items:[...f.items,{product_id:'',product_name:'',quantity:1,unit_price:0}]}));
  const removeItem = (i) => setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}));
  const updateItem = (i,key,val) => setForm(f=>{
    const items=[...f.items];
    items[i]={...items[i],[key]:val};
    if(key==='product_id'&&val){
      const p=products.find(p=>String(p.id)===String(val));
      if(p){items[i].product_name=p.name;items[i].unit_price=parseFloat(p.unit_price||0);}
    }
    return {...f,items};
  });

  const subtotal  = form.items.reduce((s,item)=>s+(parseFloat(item.quantity)||0)*(parseFloat(item.unit_price)||0),0);
  const totalCalc = subtotal+parseFloat(form.shipping_cost||0)+parseFloat(form.tax||0);

  const handleSubmit = () => {
    if(!form.order_date||form.items.length===0) return;
    fetch(`${BASE_URL}/api/purchases`,{method:'POST',headers,body:JSON.stringify(form)})
      .then(r=>r.json()).then(()=>{fetchAll();setShowForm(false);resetForm();});
  };

  const resetForm = () => setForm({
    supplier_id:'', order_date:new Date().toISOString().slice(0,10),
    due_date:'', payment_method:'cash', shipping_cost:0, tax:0, note:'',
    items:[{product_id:'',product_name:'',quantity:1,unit_price:0}],
  });

  const updateStatus = (id,status) => {
    fetch(`${BASE_URL}/api/purchases/${id}/status`,{method:'PUT',headers,body:JSON.stringify({status})})
      .then(()=>{fetchAll();if(showDetail)setShowDetail({...showDetail,status});});
  };

  const deleteOrder = (id) => {
    if(!window.confirm('Delete this order?')) return;
    fetch(`${BASE_URL}/api/purchases/${id}`,{method:'DELETE',headers})
      .then(()=>{fetchAll();setShowDetail(null);});
  };

  const fetchDetail = (id) => {
    fetch(`${BASE_URL}/api/purchases/${id}`,{headers}).then(r=>r.json()).then(d=>setShowDetail(d));
  };

  const printInvoice = (order) => {
    const win=window.open('','_blank');
    const items=order.items||[];
    win.document.write(`
      <html><head><title>${order.invoice_number}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',Arial,sans-serif;padding:48px;color:#0f172a;font-size:13px;background:#fff}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:2px solid #14b8a6}
        .logo{font-size:24px;font-weight:800;background:linear-gradient(135deg,#14b8a6,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.5px}
        .inv-no{font-size:20px;font-weight:800;color:#0f172a;font-family:monospace}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:28px}
        .section-title{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px}
        table{width:100%;border-collapse:collapse;margin-bottom:24px}
        thead th{background:#f1f5f9;padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #e2e8f0}
        tbody td{padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:13px}
        .total-box{display:flex;justify-content:flex-end;margin-bottom:32px}
        .total-inner{width:280px;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0}
        .total-row{display:flex;justify-content:space-between;padding:10px 16px;font-size:13px;border-bottom:1px solid #f1f5f9;color:#64748b}
        .total-final{display:flex;justify-content:space-between;padding:14px 16px;font-size:16px;font-weight:800;background:linear-gradient(135deg,#14b8a6,#6366f1);color:#fff}
        .badge{padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;display:inline-block}
        .paid{background:#dcfce7;color:#15803d}
        .pending{background:#fef3c7;color:#92400e}
        .overdue{background:#fee2e2;color:#b91c1c}
        .footer{text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:20px;margin-top:32px}
        @media print{body{padding:24px}}
      </style></head>
      <body>
        <div class="header">
          <div>
            <div class="logo">📦 StockPro</div>
            <div style="font-size:11px;color:#64748b;margin-top:6px;font-weight:500">Purchase Invoice</div>
          </div>
          <div style="text-align:right">
            <div class="inv-no">${order.invoice_number}</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px">📅 ${new Date(order.order_date).toLocaleDateString()}</div>
            ${order.due_date?`<div style="font-size:11px;color:#64748b">⏰ Due: ${new Date(order.due_date).toLocaleDateString()}</div>`:''}
            <span class="badge ${order.status}" style="margin-top:6px">${(order.status||'').toUpperCase()}</span>
          </div>
        </div>
        <div class="two-col">
          <div>
            <div class="section-title">Supplier</div>
            <div style="font-weight:700;font-size:14px;color:#0f172a">${order.supplier_name||'—'}</div>
            ${order.supplier_phone?`<div style="font-size:12px;color:#64748b;margin-top:3px">📞 ${order.supplier_phone}</div>`:''}
            ${order.supplier_email?`<div style="font-size:12px;color:#64748b">✉️ ${order.supplier_email}</div>`:''}
            ${order.supplier_address?`<div style="font-size:12px;color:#64748b">📍 ${order.supplier_address}</div>`:''}
          </div>
          <div>
            <div class="section-title">Payment</div>
            <div style="font-weight:600;font-size:13px">${(order.payment_method||'cash').replace('_',' ').toUpperCase()}</div>
            ${order.note?`<div style="font-size:12px;color:#64748b;margin-top:4px">📝 ${order.note}</div>`:''}
          </div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
          <tbody>
            ${items.map((item,i)=>`
              <tr>
                <td style="color:#94a3b8">${i+1}</td>
                <td style="font-weight:600">${item.product_name}</td>
                <td>${item.quantity}</td>
                <td style="color:#64748b">$${parseFloat(item.unit_price).toFixed(2)}</td>
                <td style="font-weight:700">$${parseFloat(item.total_price).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total-box">
          <div class="total-inner">
            <div class="total-row"><span>Subtotal</span><span>$${parseFloat(order.subtotal||0).toFixed(2)}</span></div>
            <div class="total-row"><span>Shipping</span><span>$${parseFloat(order.shipping_cost||0).toFixed(2)}</span></div>
            <div class="total-row"><span>Tax</span><span>$${parseFloat(order.tax||0).toFixed(2)}</span></div>
            <div class="total-final"><span>TOTAL</span><span>$${parseFloat(order.total||0).toFixed(2)}</span></div>
          </div>
        </div>
        <div class="footer">Thank you for your business • StockPro v1.0 • ${new Date().toLocaleString()}</div>
        <script>window.onload=()=>window.print();</script>
      </body></html>
    `);
    win.document.close();
  };

  // ── Stats columns per breakpoint ──
  const statsCols = isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(3,1fr)' : 'repeat(5,1fr)';

  return (
    <div style={{ background:dm.bg, minHeight:'100vh', width:'100%', boxSizing:'border-box', overflowX:'hidden' }}>

      {/* ── Header ── */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom: isMobile ? 12 : 20,
        flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <h4 style={{ fontWeight:800, margin:0, color:dm.text, fontSize: isMobile ? '1.05rem' : '1.4rem', letterSpacing:'-0.5px' }}>
            Purchase Orders
          </h4>
          <div style={{ fontSize:12, color:dm.muted, marginTop:2 }}>
            Dashboard <i className="bi bi-chevron-right" style={{ fontSize:9, margin:'0 4px' }}></i>
            <span style={{ color:dm.text }}>Purchases</span>
          </div>
        </div>
        <button onClick={()=>{resetForm();setShowForm(true);}}
          style={{ background:'linear-gradient(135deg,#14b8a6,#6366f1)', color:'#fff', border:'none', borderRadius:10, padding: isMobile ? '8px 14px' : '10px 20px', fontWeight:700, cursor:'pointer', fontSize: isMobile ? 12 : 13, display:'flex', alignItems:'center', gap:7, boxShadow:'0 4px 15px rgba(20,184,166,0.4)', fontFamily:'inherit', whiteSpace:'nowrap' }}>
          <i className="bi bi-plus-lg"></i>
          {isMobile ? 'New Order' : 'New Purchase Order'}
        </button>
      </div>

      {/* ── Stats: 5→3→2 cols ── */}
      <div style={{ display:'grid', gridTemplateColumns: statsCols, gap: isMobile ? 8 : 12, marginBottom: isMobile ? 12 : 16, width:'100%', boxSizing:'border-box' }}>
        {[
          { label:'Total Orders',  value:totalOrders,                   icon:'bi-receipt',      grad:'linear-gradient(135deg,#14b8a6,#6366f1)', glow:'rgba(20,184,166,0.3)' },
          { label:'Paid',          value:totalPaid,                     icon:'bi-check-circle', grad:'linear-gradient(135deg,#10b981,#14b8a6)', glow:'rgba(16,185,129,0.3)' },
          { label:'Pending',       value:totalPending,                  icon:'bi-clock',        grad:'linear-gradient(135deg,#f59e0b,#f97316)', glow:'rgba(245,158,11,0.3)' },
          { label:'Total Amount',  value:`$${totalAmount.toFixed(0)}`,  icon:'bi-cash-stack',   grad:'linear-gradient(135deg,#6366f1,#ec4899)', glow:'rgba(99,102,241,0.3)' },
          { label:'Paid Amount',   value:`$${paidAmount.toFixed(0)}`,   icon:'bi-wallet2',      grad:'linear-gradient(135deg,#0ea5e9,#14b8a6)', glow:'rgba(14,165,233,0.3)' },
        ].map((c,i) => (
          <div key={i} style={{ ...glass, borderRadius:16, padding: isMobile ? '10px 12px' : '14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all 0.2s' }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 12px 30px ${c.glow}`; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=darkMode?'0 8px 32px rgba(0,0,0,0.3)':'0 8px 32px rgba(15,23,42,0.08)'; }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize: isMobile ? 9 : 10, color:dm.muted, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.label}</div>
              <div style={{ fontSize: isMobile ? 18 : (typeof c.value==='string'&&c.value.length>5?18:24), fontWeight:800, color:dm.text, lineHeight:1 }}>{c.value}</div>
            </div>
            <div style={{ width: isMobile ? 34 : 42, height: isMobile ? 34 : 42, borderRadius:12, background:c.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? 14 : 18, color:'#fff', boxShadow:`0 4px 15px ${c.glow}`, flexShrink:0, marginLeft:8 }}>
              <i className={`bi ${c.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Panel ── */}
      <div style={{ ...glass, borderRadius:20, overflow:'hidden', width:'100%' }}>

        {/* Toolbar */}
        <div style={{ padding: isMobile ? '10px 12px' : '12px 18px', display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid ${dm.border}`, background:dm.card2, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, fontSize:13, color:dm.text, display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap' }}>
            <i className="bi bi-receipt" style={{ color:'#14b8a6' }}></i>
            {!isMobile && 'Order List'}
          </span>
          <div style={{ flex:1 }}></div>
          {/* Search — full width on mobile */}
          <div style={{ position:'relative', width: isMobile ? '100%' : 220 }}>
            <i className="bi bi-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:dm.muted, fontSize:12, pointerEvents:'none' }}></i>
            <input style={{ ...inp, paddingLeft:32, fontSize:12 }} placeholder={isMobile ? 'Search...' : 'Search invoice or supplier...'}
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>

        {/* Tabs — scrollable on mobile */}
        <div style={{ display:'flex', gap:3, padding: isMobile ? '6px 10px' : '8px 18px', background:dm.card2, borderBottom:`1px solid ${dm.border}`, overflowX:'auto', WebkitOverflowScrolling:'touch', flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
          {['all','pending','paid','overdue','cancelled'].map(tab=>{
            const cfg = STATUS_CFG[tab];
            return (
              <button key={tab} onClick={()=>setActiveTab(tab)}
                style={{ padding: isMobile ? '4px 10px' : '5px 14px', borderRadius:8, fontSize: isMobile ? 10 : 11, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit', transition:'all 0.15s', whiteSpace:'nowrap', flexShrink:0,
                  background: activeTab===tab ? (cfg?cfg.grad:'linear-gradient(135deg,#14b8a6,#6366f1)') : 'transparent',
                  color: activeTab===tab ? '#fff' : dm.muted,
                  boxShadow: activeTab===tab ? `0 4px 12px ${cfg?cfg.glow:'rgba(20,184,166,0.3)'}` : 'none',
                }}>
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
                <span style={{ marginLeft:4, background:activeTab===tab?'rgba(255,255,255,0.25)':(darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'), color:activeTab===tab?'#fff':dm.muted, padding:'1px 6px', borderRadius:10, fontSize:9 }}>
                  {tab==='all'?orders.length:orders.filter(o=>o.status===tab).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table — horizontal scroll on mobile */}
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:60, color:dm.muted }}>
              <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid rgba(20,184,166,0.2)', borderTop:'3px solid #14b8a6', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
              Loading orders...
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth: isMobile ? 560 : (isTablet ? 700 : 'auto') }}>
              <thead>
                <tr style={{ background:dm.card2 }}>
                  {/* Hide some columns on small screens */}
                  {[
                    { label:'INVOICE #',  hide: false       },
                    { label:'SUPPLIER',   hide: false       },
                    { label:'ORDER DATE', hide: isMobile    },
                    { label:'DUE DATE',   hide: isMobile    },
                    { label:'PAYMENT',    hide: isMobile    },
                    { label:'SHIPPING',   hide: isSmall     },
                    { label:'TAX',        hide: isSmall     },
                    { label:'TOTAL',      hide: false       },
                    { label:'STATUS',     hide: false       },
                    { label:'ACTIONS',    hide: false       },
                  ].filter(h => !h.hide).map(h => (
                    <th key={h.label} style={{ padding: isMobile ? '8px 10px' : '10px 14px', fontSize:10, fontWeight:700, color:dm.muted, textTransform:'uppercase', letterSpacing:'0.07em', borderBottom:`1px solid ${dm.border}`, textAlign:'left', whiteSpace:'nowrap' }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={10} style={{ textAlign:'center', padding:'60px', color:dm.muted }}>
                    <div style={{ width:60, height:60, borderRadius:16, background:'rgba(20,184,166,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', border:'1px solid rgba(20,184,166,0.2)' }}>
                      <i className="bi bi-receipt" style={{ fontSize:28, color:'#14b8a6' }}></i>
                    </div>
                    <div style={{ fontWeight:600, color:dm.text }}>No purchase orders yet</div>
                    <div style={{ fontSize:12, marginTop:4 }}>Create your first purchase order</div>
                  </td></tr>
                ) : filtered.map(o => {
                  const st = STATUS_CFG[o.status] || STATUS_CFG.pending;
                  return (
                    <tr key={o.id}
                      style={{ borderBottom:`1px solid ${dm.border}`, cursor:'pointer', transition:'all 0.15s ease', borderLeft:'3px solid transparent' }}
                      onMouseEnter={e=>{ e.currentTarget.style.background=dm.hover; e.currentTarget.style.borderLeft='3px solid #14b8a6'; e.currentTarget.style.transform='translateX(2px)'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderLeft='3px solid transparent'; e.currentTarget.style.transform='translateX(0)'; }}
                      onClick={()=>fetchDetail(o.id)}>

                      {/* Invoice # */}
                      <td style={{ padding: isMobile ? '10px 10px' : '13px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          {!isMobile && (
                            <div style={{ width:30, height:30, borderRadius:8, background:'rgba(20,184,166,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid rgba(20,184,166,0.2)' }}>
                              <i className="bi bi-receipt" style={{ color:'#14b8a6', fontSize:12 }}></i>
                            </div>
                          )}
                          <span style={{ fontFamily:'monospace', fontSize: isMobile ? 11 : 12, fontWeight:700, color:'#14b8a6', whiteSpace:'nowrap' }}>{o.invoice_number}</span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td style={{ padding: isMobile ? '10px 10px' : '13px 14px' }}>
                        <div style={{ fontWeight:600, fontSize: isMobile ? 12 : 13, color:dm.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth: isMobile ? 100 : 'none' }}>{o.supplier_name||'—'}</div>
                      </td>

                      {/* Order Date — hidden mobile */}
                      {!isMobile && <td style={{ padding:'13px 14px', fontSize:12, color:dm.muted, whiteSpace:'nowrap' }}>{new Date(o.order_date).toLocaleDateString()}</td>}

                      {/* Due Date — hidden mobile */}
                      {!isMobile && (
                        <td style={{ padding:'13px 14px', fontSize:12, color:o.due_date&&new Date(o.due_date)<new Date()&&o.status!=='paid'?'#ef4444':dm.muted, whiteSpace:'nowrap' }}>
                          {o.due_date?new Date(o.due_date).toLocaleDateString():'—'}
                        </td>
                      )}

                      {/* Payment — hidden mobile */}
                      {!isMobile && (
                        <td style={{ padding:'13px 14px' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:'rgba(99,102,241,0.12)', color:'#6366f1', border:'1px solid rgba(99,102,241,0.25)', whiteSpace:'nowrap' }}>
                            {PAYMENT_ICONS[o.payment_method]||'💰'} {!isTablet && (o.payment_method||'cash').replace('_',' ')}
                          </span>
                        </td>
                      )}

                      {/* Shipping — hidden small */}
                      {!isSmall && <td style={{ padding:'13px 14px', fontSize:12, color:dm.muted, fontFamily:'monospace' }}>${parseFloat(o.shipping_cost||0).toFixed(2)}</td>}

                      {/* Tax — hidden small */}
                      {!isSmall && <td style={{ padding:'13px 14px', fontSize:12, color:dm.muted, fontFamily:'monospace' }}>${parseFloat(o.tax||0).toFixed(2)}</td>}

                      {/* Total */}
                      <td style={{ padding: isMobile ? '10px 10px' : '13px 14px' }}>
                        <span style={{ fontWeight:800, fontSize: isMobile ? 12 : 14, color:dm.text, fontFamily:'monospace', whiteSpace:'nowrap' }}>${parseFloat(o.total||0).toFixed(2)}</span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: isMobile ? '10px 10px' : '13px 14px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding: isMobile ? '3px 7px' : '4px 10px', borderRadius:20, fontSize: isMobile ? 9 : 10, fontWeight:700, background:`${st.color}15`, color:st.color, border:`1px solid ${st.color}30`, whiteSpace:'nowrap' }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:st.color, boxShadow:`0 0 6px ${st.glow}`, animation:o.status==='pending'?'pulse 2s infinite':'none', flexShrink:0 }}/>
                          {isMobile ? st.label.slice(0,3) : st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: isMobile ? '10px 10px' : '13px 14px' }}>
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={e=>{ e.stopPropagation(); fetchDetail(o.id); }}
                            style={{ width: isMobile ? 26 : 28, height: isMobile ? 26 : 28, borderRadius:8, border:`1px solid ${dm.border}`, background:'transparent', color:dm.muted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:11, transition:'all 0.15s' }}
                            onMouseEnter={e=>{ e.currentTarget.style.background='linear-gradient(135deg,#14b8a6,#6366f1)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.border='1px solid transparent'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=dm.muted; e.currentTarget.style.border=`1px solid ${dm.border}`; }}>
                            <i className="bi bi-eye"></i>
                          </button>
                          <button onClick={e=>{ e.stopPropagation(); deleteOrder(o.id); }}
                            style={{ width: isMobile ? 26 : 28, height: isMobile ? 26 : 28, borderRadius:8, border:`1px solid ${dm.border}`, background:'transparent', color:dm.muted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:11, transition:'all 0.15s' }}
                            onMouseEnter={e=>{ e.currentTarget.style.background='linear-gradient(135deg,#ef4444,#f97316)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.border='1px solid transparent'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=dm.muted; e.currentTarget.style.border=`1px solid ${dm.border}`; }}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {showDetail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile ? 10 : 20 }}>
          <div style={{ ...glass, borderRadius: isMobile ? 16 : 24, width:'100%', maxWidth: isMobile ? '100%' : 720, maxHeight: isMobile ? '94vh' : '90vh', overflowY:'auto', boxShadow:'0 30px 80px rgba(0,0,0,0.5)' }}>

            {/* Modal Header */}
            <div style={{ padding: isMobile ? '12px 14px' : '20px 24px', borderBottom:`1px solid ${dm.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:dm.card2, borderRadius: isMobile ? '16px 16px 0 0' : '24px 24px 0 0', position:'sticky', top:0, zIndex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius:12, background:'linear-gradient(135deg,#14b8a6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 15px rgba(20,184,166,0.4)', flexShrink:0 }}>
                  <i className="bi bi-receipt" style={{ color:'#fff', fontSize: isMobile ? 14 : 18 }}></i>
                </div>
                <div>
                  <div style={{ fontWeight:800, color:dm.text, fontSize: isMobile ? 12 : 15, fontFamily:'monospace' }}>{showDetail.invoice_number}</div>
                  <div style={{ fontSize:10, color:dm.muted, marginTop:1 }}>Purchase Order Detail</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
                {/* Status buttons — hide label on mobile */}
                {Object.entries(STATUS_CFG).map(([key,cfg]) => (
                  <button key={key} onClick={()=>{ updateStatus(showDetail.id,key); setShowDetail({...showDetail,status:key}); }}
                    style={{ padding: isMobile ? '4px 8px' : '5px 11px', borderRadius:8, fontSize: isMobile ? 10 : 11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                      background: showDetail.status===key ? cfg.grad : 'transparent',
                      color: showDetail.status===key ? '#fff' : dm.muted,
                      border: `1px solid ${showDetail.status===key?'transparent':dm.border}`,
                      boxShadow: showDetail.status===key ? `0 4px 12px ${cfg.glow}` : 'none',
                    }}>
                    {isMobile ? cfg.label.slice(0,3) : cfg.label}
                  </button>
                ))}
                {!isMobile && (
                  <button onClick={()=>printInvoice(showDetail)}
                    style={{ padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#14b8a6,#6366f1)', color:'#fff', display:'flex', alignItems:'center', gap:5, boxShadow:'0 4px 12px rgba(20,184,166,0.4)', fontFamily:'inherit' }}>
                    <i className="bi bi-printer"></i>Print
                  </button>
                )}
                <button onClick={()=>setShowDetail(null)}
                  style={{ background:'transparent', border:'none', cursor:'pointer', color:dm.muted, fontSize:22, lineHeight:1 }}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            </div>

            <div style={{ padding: isMobile ? '14px' : '22px 24px' }}>
              {/* Print button for mobile */}
              {isMobile && (
                <button onClick={()=>printInvoice(showDetail)}
                  style={{ width:'100%', padding:'9px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#14b8a6,#6366f1)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:'0 4px 12px rgba(20,184,166,0.4)', fontFamily:'inherit', marginBottom:14 }}>
                  <i className="bi bi-printer"></i>Print Invoice
                </button>
              )}

              {/* Info Grid: 2col → 1col on mobile */}
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 10 : 14, marginBottom: isMobile ? 14 : 20 }}>
                {/* Supplier */}
                <div style={{ ...glass, borderRadius:14, padding: isMobile ? '12px 14px' : '16px 18px', border:`1px solid ${dm.border}` }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'#14b8a6', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                    <i className="bi bi-building"></i>Supplier
                  </div>
                  <div style={{ fontWeight:700, fontSize: isMobile ? 13 : 14, color:dm.text }}>{showDetail.supplier_name||'—'}</div>
                  {showDetail.supplier_phone&&<div style={{ fontSize:12, color:dm.muted, marginTop:4, display:'flex', alignItems:'center', gap:5 }}><i className="bi bi-telephone" style={{ color:'#14b8a6', fontSize:11 }}></i>{showDetail.supplier_phone}</div>}
                  {showDetail.supplier_email&&<div style={{ fontSize:12, color:dm.muted, display:'flex', alignItems:'center', gap:5 }}><i className="bi bi-envelope" style={{ color:'#14b8a6', fontSize:11 }}></i>{showDetail.supplier_email}</div>}
                  {showDetail.supplier_address&&<div style={{ fontSize:12, color:dm.muted, display:'flex', alignItems:'center', gap:5 }}><i className="bi bi-geo-alt" style={{ color:'#ef4444', fontSize:11 }}></i>{showDetail.supplier_address}</div>}
                </div>

                {/* Order Info */}
                <div style={{ ...glass, borderRadius:14, padding: isMobile ? '12px 14px' : '16px 18px', border:`1px solid ${dm.border}` }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                    <i className="bi bi-info-circle"></i>Order Info
                  </div>
                  {[
                    { icon:'bi-calendar3',   label:'Order Date', value:new Date(showDetail.order_date).toLocaleDateString(), color:'#14b8a6' },
                    { icon:'bi-calendar-x',  label:'Due Date',   value:showDetail.due_date?new Date(showDetail.due_date).toLocaleDateString():'—', color:'#f59e0b' },
                    { icon:'bi-credit-card', label:'Payment',    value:(showDetail.payment_method||'').replace('_',' ').toUpperCase(), color:'#6366f1' },
                  ].map((r,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                      <i className={`bi ${r.icon}`} style={{ color:r.color, fontSize:11, width:16, flexShrink:0 }}></i>
                      <span style={{ fontSize:11, color:dm.muted, width:65, flexShrink:0 }}>{r.label}:</span>
                      <span style={{ fontSize:12, fontWeight:600, color:dm.text }}>{r.value}</span>
                    </div>
                  ))}
                  {showDetail.note&&<div style={{ fontSize:11, color:dm.muted, marginTop:4, padding:'6px 8px', background:'rgba(99,102,241,0.08)', borderRadius:6, border:'1px solid rgba(99,102,241,0.15)' }}>📝 {showDetail.note}</div>}
                </div>
              </div>

              {/* Items Table */}
              <div style={{ ...glass, borderRadius:14, overflow:'hidden', marginBottom: isMobile ? 12 : 16, border:`1px solid ${dm.border}` }}>
                <div style={{ padding: isMobile ? '9px 12px' : '11px 16px', borderBottom:`1px solid ${dm.border}`, fontWeight:700, fontSize:13, color:dm.text, display:'flex', alignItems:'center', gap:7, background:dm.card2 }}>
                  <i className="bi bi-box-seam" style={{ color:'#14b8a6' }}></i>Order Items
                  <span style={{ marginLeft:'auto', fontSize:11, color:dm.muted }}>{(showDetail.items||[]).length} items</span>
                </div>
                <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth: isMobile ? 380 : 'auto' }}>
                    <thead>
                      <tr style={{ background:dm.card2 }}>
                        {['#','Product','Qty','Unit Price','Total'].map(h => (
                          <th key={h} style={{ padding: isMobile ? '7px 10px' : '9px 14px', fontSize:10, fontWeight:700, color:dm.muted, textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'left', borderBottom:`1px solid ${dm.border}`, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(showDetail.items||[]).map((item,i) => (
                        <tr key={i} style={{ borderBottom:`1px solid ${dm.border}`, transition:'all 0.15s', borderLeft:'3px solid transparent' }}
                          onMouseEnter={e=>{ e.currentTarget.style.background=dm.hover; e.currentTarget.style.borderLeft='3px solid #14b8a6'; }}
                          onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderLeft='3px solid transparent'; }}>
                          <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', color:dm.muted, fontSize:12 }}>{i+1}</td>
                          <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', fontWeight:600, color:dm.text, fontSize: isMobile ? 12 : 13 }}>{item.product_name}</td>
                          <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', color:dm.text, fontSize:12, fontFamily:'monospace' }}>{item.quantity}</td>
                          <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', color:dm.muted, fontSize:12, fontFamily:'monospace' }}>${parseFloat(item.unit_price).toFixed(2)}</td>
                          <td style={{ padding: isMobile ? '8px 10px' : '10px 14px', fontWeight:700, color:dm.text, fontSize: isMobile ? 12 : 13, fontFamily:'monospace' }}>${parseFloat(item.total_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div style={{ display:'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                <div style={{ width: isMobile ? '100%' : 280, ...glass, borderRadius:14, overflow:'hidden', border:`1px solid ${dm.border}` }}>
                  {[
                    { label:'Subtotal', value:parseFloat(showDetail.subtotal||0).toFixed(2) },
                    { label:'Shipping', value:parseFloat(showDetail.shipping_cost||0).toFixed(2) },
                    { label:'Tax',      value:parseFloat(showDetail.tax||0).toFixed(2) },
                  ].map((row,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding: isMobile ? '8px 14px' : '10px 16px', borderBottom:`1px solid ${dm.border}`, fontSize:13, color:dm.muted }}>
                      <span>{row.label}</span>
                      <span style={{ fontFamily:'monospace' }}>${row.value}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding: isMobile ? '12px 14px' : '14px 16px', fontSize: isMobile ? 15 : 16, fontWeight:800, background:'linear-gradient(135deg,#14b8a6,#6366f1)', color:'#fff' }}>
                    <span>TOTAL</span>
                    <span style={{ fontFamily:'monospace' }}>${parseFloat(showDetail.total||0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Order Modal ── */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile ? 10 : 20 }}>
          <div style={{ ...glass, borderRadius: isMobile ? 16 : 24, width:'100%', maxWidth: isMobile ? '100%' : 700, maxHeight: isMobile ? '94vh' : '92vh', overflowY:'auto', boxShadow:'0 30px 80px rgba(0,0,0,0.5)' }}>

            {/* Header */}
            <div style={{ padding: isMobile ? '12px 14px' : '20px 24px', borderBottom:`1px solid ${dm.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:dm.card2, borderRadius: isMobile ? '16px 16px 0 0' : '24px 24px 0 0', position:'sticky', top:0, zIndex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius:12, background:'linear-gradient(135deg,#14b8a6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 15px rgba(20,184,166,0.4)', flexShrink:0 }}>
                  <i className="bi bi-receipt-cutoff" style={{ color:'#fff', fontSize: isMobile ? 14 : 18 }}></i>
                </div>
                <div>
                  <h5 style={{ margin:0, fontWeight:800, color:dm.text, fontSize: isMobile ? 13 : 15 }}>New Purchase Order</h5>
                  <div style={{ fontSize:10, color:dm.muted, marginTop:1 }}>Fill in the order details below</div>
                </div>
              </div>
              <button onClick={()=>setShowForm(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:dm.muted, fontSize:22, lineHeight:1 }}>
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div style={{ padding: isMobile ? '14px' : '22px 24px' }}>

              {/* Basic Info — 2col → 1col on mobile */}
              <div style={{ marginBottom: isMobile ? 16 : 20 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#14b8a6', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                  <i className="bi bi-info-circle"></i>Order Information
                </div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 10 : 12 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.07em' }}>Supplier</label>
                    <select style={inp} value={form.supplier_id} onChange={e=>setForm({...form,supplier_id:e.target.value})}>
                      <option value="">Select Supplier</option>
                      {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.07em' }}>Payment Method</label>
                    <select style={inp} value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}>
                      {PAYMENT_METHODS.map(m=><option key={m} value={m}>{PAYMENT_ICONS[m]} {m.replace('_',' ').toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.07em' }}>Order Date *</label>
                    <input style={inp} type="date" value={form.order_date} onChange={e=>setForm({...form,order_date:e.target.value})}/>
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.07em' }}>Due Date</label>
                    <input style={inp} type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: isMobile ? 16 : 20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#14b8a6', textTransform:'uppercase', letterSpacing:'0.1em', display:'flex', alignItems:'center', gap:6 }}>
                    <i className="bi bi-box-seam"></i>Order Items
                  </div>
                  <button onClick={addItem}
                    style={{ background:'linear-gradient(135deg,#14b8a6,#6366f1)', color:'#fff', border:'none', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, boxShadow:'0 4px 12px rgba(20,184,166,0.3)', fontFamily:'inherit' }}>
                    <i className="bi bi-plus"></i>Add Item
                  </button>
                </div>

                <div style={{ ...glass, borderRadius:12, overflow:'hidden', border:`1px solid ${dm.border}` }}>
                  <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth: isMobile ? 420 : 'auto' }}>
                      <thead>
                        <tr style={{ background:dm.card2 }}>
                          {['Product','Qty','Unit Price ($)','Total',''].map(h => (
                            <th key={h} style={{ padding: isMobile ? '7px 8px' : '8px 12px', fontSize:10, fontWeight:700, color:dm.muted, textTransform:'uppercase', textAlign:'left', borderBottom:`1px solid ${dm.border}`, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item,i) => (
                          <tr key={i} style={{ borderBottom:`1px solid ${dm.border}` }}>
                            <td style={{ padding: isMobile ? '6px 8px' : '8px 10px', minWidth: isMobile ? 130 : 160 }}>
                              <select style={{ ...inp, padding:'6px 8px', fontSize:12 }}
                                value={item.product_id} onChange={e=>updateItem(i,'product_id',e.target.value)}>
                                <option value="">Custom...</option>
                                {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              {!item.product_id&&(
                                <input style={{ ...inp, padding:'6px 8px', marginTop:4, fontSize:12 }}
                                  placeholder="Product name"
                                  value={item.product_name} onChange={e=>updateItem(i,'product_name',e.target.value)}/>
                              )}
                            </td>
                            <td style={{ padding: isMobile ? '6px 8px' : '8px 10px', width: isMobile ? 55 : 70 }}>
                              <input style={{ ...inp, padding:'6px 8px', textAlign:'center', fontSize:12 }} type="number" min="1"
                                value={item.quantity} onChange={e=>updateItem(i,'quantity',e.target.value)}/>
                            </td>
                            <td style={{ padding: isMobile ? '6px 8px' : '8px 10px', width: isMobile ? 90 : 110 }}>
                              <input style={{ ...inp, padding:'6px 8px', fontSize:12 }} type="number" min="0" step="0.01"
                                value={item.unit_price} onChange={e=>updateItem(i,'unit_price',e.target.value)}/>
                            </td>
                            <td style={{ padding: isMobile ? '6px 8px' : '8px 10px', fontWeight:700, color:'#14b8a6', fontSize: isMobile ? 12 : 13, fontFamily:'monospace', whiteSpace:'nowrap' }}>
                              ${((parseFloat(item.quantity)||0)*(parseFloat(item.unit_price)||0)).toFixed(2)}
                            </td>
                            <td style={{ padding: isMobile ? '6px 8px' : '8px 10px' }}>
                              {form.items.length>1&&(
                                <button onClick={()=>removeItem(i)}
                                  style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#ef4444', fontSize:11, transition:'all 0.15s' }}
                                  onMouseEnter={e=>{ e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='#fff'; }}
                                  onMouseLeave={e=>{ e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.color='#ef4444'; }}>
                                  <i className="bi bi-x"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Shipping, Tax, Note — 3col → 1col on mobile */}
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 14 : 16 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.07em' }}>🚚 Shipping ($)</label>
                  <input style={inp} type="number" min="0" step="0.01"
                    value={form.shipping_cost} onChange={e=>setForm({...form,shipping_cost:e.target.value})}/>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.07em' }}>💰 Tax ($)</label>
                  <input style={inp} type="number" min="0" step="0.01"
                    value={form.tax} onChange={e=>setForm({...form,tax:e.target.value})}/>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.07em' }}>📝 Note</label>
                  <input style={inp} placeholder="Optional..."
                    value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
                </div>
              </div>

              {/* Total */}
              <div style={{ display:'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                <div style={{ width: isMobile ? '100%' : 280, ...glass, borderRadius:14, overflow:'hidden', border:`1px solid ${dm.border}` }}>
                  {[
                    { label:'Subtotal', value:subtotal.toFixed(2) },
                    { label:'Shipping', value:parseFloat(form.shipping_cost||0).toFixed(2) },
                    { label:'Tax',      value:parseFloat(form.tax||0).toFixed(2) },
                  ].map((row,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding: isMobile ? '8px 14px' : '9px 16px', borderBottom:`1px solid ${dm.border}`, fontSize:13, color:dm.muted }}>
                      <span>{row.label}</span><span style={{ fontFamily:'monospace' }}>${row.value}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding: isMobile ? '12px 14px' : '13px 16px', fontSize: isMobile ? 15 : 16, fontWeight:800, background:'linear-gradient(135deg,#14b8a6,#6366f1)', color:'#fff' }}>
                    <span>TOTAL</span><span style={{ fontFamily:'monospace' }}>${totalCalc.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: isMobile ? '12px 14px 16px' : '14px 24px 20px', display:'flex', gap:8, borderTop:`1px solid ${dm.border}` }}>
              <button onClick={handleSubmit}
                style={{ flex:1, padding: isMobile ? '11px' : '12px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#14b8a6,#6366f1)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:'0 4px 15px rgba(20,184,166,0.4)', fontFamily:'inherit' }}>
                <i className="bi bi-check-lg"></i>
                {isMobile ? 'Create Order' : 'Create Purchase Order'}
              </button>
              <button onClick={()=>setShowForm(false)}
                style={{ flex:1, padding: isMobile ? '11px' : '12px', borderRadius:12, border:`1px solid ${dm.border}`, background:'transparent', color:dm.text, fontWeight:600, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.4)}}
      `}</style>
    </div>
  );
}