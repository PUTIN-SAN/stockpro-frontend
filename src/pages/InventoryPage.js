import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
} from '@tanstack/react-table';

const BASE_URL = 'http://localhost:5000';

function getProductImage(productId) {
  return localStorage.getItem(`productImg_${productId}`) || null;
}
function clearOldProductImages(keepId) {
  const keys = Object.keys(localStorage)
    .filter(k => k.startsWith('productImg_') && k !== `productImg_${keepId}`);
  keys.slice(0, Math.ceil(keys.length / 2)).forEach(k => localStorage.removeItem(k));
}
function setProductImage(productId, dataUrl) {
  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d');
  const img    = new Image();
  img.onload = () => {
    const MAX = 150;
    const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
    canvas.width  = Math.round(img.width  * ratio);
    canvas.height = Math.round(img.height * ratio);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const compressed = canvas.toDataURL('image/jpeg', 0.5);
    try {
      localStorage.setItem(`productImg_${productId}`, compressed);
    } catch (e) {
      clearOldProductImages(productId);
      try { localStorage.setItem(`productImg_${productId}`, compressed); }
      catch (e2) { console.warn('Storage full'); }
    }
  };
  img.src = dataUrl;
}
function removeProductImage(productId) {
  localStorage.removeItem(`productImg_${productId}`);
}

const CAT_COLORS = {
  'food':      { bg:'rgba(16,185,129,0.15)',  color:'#10b981', border:'rgba(16,185,129,0.3)'  },
  'drink':     { bg:'rgba(20,184,166,0.15)',  color:'#14b8a6', border:'rgba(20,184,166,0.3)'  },
  'iPhone':    { bg:'rgba(99,102,241,0.15)',  color:'#6366f1', border:'rgba(99,102,241,0.3)'  },
  'Samsung':   { bg:'rgba(245,158,11,0.15)',  color:'#f59e0b', border:'rgba(245,158,11,0.3)'  },
  'Vivo':      { bg:'rgba(20,184,166,0.15)',  color:'#14b8a6', border:'rgba(20,184,166,0.3)'  },
  'OPPO':      { bg:'rgba(245,158,11,0.15)',  color:'#f59e0b', border:'rgba(245,158,11,0.3)'  },
  'Apple':     { bg:'rgba(100,116,139,0.15)', color:'#64748b', border:'rgba(100,116,139,0.3)' },
  'skin care': { bg:'rgba(236,72,153,0.15)',  color:'#ec4899', border:'rgba(236,72,153,0.3)'  },
  'book':      { bg:'rgba(249,115,22,0.15)',  color:'#f97316', border:'rgba(249,115,22,0.3)'  },
  'General':   { bg:'rgba(100,116,139,0.15)', color:'#64748b', border:'rgba(100,116,139,0.3)' },
};

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

function ProductAvatar({ product, index, size = 36 }) {
  const img  = getProductImage(product.id);
  const grad = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: img ? 'none' : grad,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)', overflow: 'hidden',
      border: img ? '2px solid rgba(20,184,166,0.4)' : 'none',
    }}>
      {img
        ? <img src={img} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : product.name?.slice(0,2).toUpperCase()
      }
    </div>
  );
}

// ── Breakpoint hook ──
function useBreakpoint() {
  const get = (w) => {
    if (w < 600)  return 'mobile';
    if (w < 900)  return 'tablet';
    if (w < 1200) return 'tabletLg';
    return 'desktop';
  };
  const [bp, setBp] = useState(get(window.innerWidth));
  useEffect(() => {
    const h = () => setBp(get(window.innerWidth));
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

export default function InventoryPage({ darkMode }) {
  const { bp, isMobile, isTablet, isTabletLg, isSmall } = useBreakpoint();

  const [products, setProducts]       = useState([]);
  const [suppliers, setSuppliers]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTxForm, setShowTxForm]   = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [txType, setTxType] = useState('in');
  const [txQty, setTxQty]   = useState('');
  const [txNote, setTxNote] = useState('');
  const [globalFilter, setGlobalFilter]   = useState('');
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting]             = useState([]);
  const [tick, setTick]     = useState(0);
  const [form, setForm]     = useState({ name:'', category:'', qty:'', price:'', supplier_id:'', description:'' });
  const [modalImage, setModalImage] = useState(null);
  const imgInputRef = useRef();

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
    hover:  darkMode ? 'rgba(20,184,166,0.08)' : 'rgba(20,184,166,0.05)',
  };

  const glass = {
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    background: dm.card, border: `1px solid ${dm.border}`,
    boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(15,23,42,0.08)',
    boxSizing: 'border-box',
  };

  const inp = {
    background: dm.input, border: `1px solid ${dm.border}`,
    color: dm.text, borderRadius: 10, padding: '8px 12px',
    width: '100%', outline: 'none', fontSize: '13px',
    fontFamily: 'inherit', transition: 'all 0.2s', boxSizing: 'border-box',
  };

  const fetchProducts = () => {
    setLoading(true);
    fetch(`${BASE_URL}/api/products`, { headers })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setProducts(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    fetch(`${BASE_URL}/api/suppliers`, { headers })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSuppliers(d); });
  }, []);

  const categories = useMemo(() => [...new Set(products.map(p => p.category || 'General'))], [products]);
  const totalValue  = useMemo(() => products.reduce((s, p) => s + (p.quantity * parseFloat(p.unit_price || 0)), 0), [products]);
  const lowCount    = useMemo(() => products.filter(p => p.quantity <= p.min_quantity).length, [products]);

  const catBadge = (cat) => {
    const c = CAT_COLORS[cat] || CAT_COLORS['General'];
    return (
      <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:8, fontSize:11, fontWeight:600, background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
        {cat || 'General'}
      </span>
    );
  };

  const statusBadge = (qty, min) => {
    const s   = qty === 0 ? 'out' : qty <= min ? 'low' : 'ok';
    const cfg = {
      ok:  { color:'#10b981', glow:'rgba(16,185,129,0.4)', label:'In Stock',     short:'OK'  },
      low: { color:'#f59e0b', glow:'rgba(245,158,11,0.4)', label:'Low Stock',    short:'Low' },
      out: { color:'#ef4444', glow:'rgba(239,68,68,0.4)',  label:'Out of Stock', short:'Out' },
    };
    const c = cfg[s];
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding: isMobile ? '3px 7px' : '4px 10px', borderRadius:20, fontSize: isMobile ? 10 : 11, fontWeight:600, background:`${c.color}15`, color:c.color, border:`1px solid ${c.color}30`, whiteSpace:'nowrap' }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:c.color, flexShrink:0, boxShadow:`0 0 6px ${c.glow}`, animation:s==='ok'?'pulse 2s infinite':'none' }}/>
        {isMobile ? c.short : c.label}
      </span>
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image too large! Max 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const canvas = document.createElement('canvas');
      const ctx    = canvas.getContext('2d');
      const img    = new Image();
      img.onload = () => {
        const MAX = 150;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setModalImage(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ── Responsive column visibility ──
  // mobile: product, stock, status, actions
  // tablet: + category, price
  // tabletLg: + value, supplier
  // desktop: all
  const columns = useMemo(() => [
    {
      id: 'product', header: 'PRODUCT', accessorKey: 'name',
      cell: ({ getValue, row }) => (
        <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 8 : 10 }}>
          <ProductAvatar product={row.original} index={row.index} size={isMobile ? 28 : 36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight:700, fontSize: isMobile ? 12 : 13, color:dm.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth: isMobile ? 100 : 'none' }}>{getValue()}</div>
            {!isMobile && <div style={{ fontSize:10, color:dm.muted, fontFamily:'monospace' }}>PRD-{String(row.original.id || row.index+1).padStart(3,'0')}</div>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category', header: 'CATEGORY',
      cell: ({ getValue }) => catBadge(getValue() || 'General'),
      // hide on mobile
    },
    {
      accessorKey: 'quantity', header: 'STOCK',
      cell: ({ getValue, row }) => {
        const qty   = getValue();
        const min   = row.original.min_quantity || 10;
        const pct   = Math.min(100, Math.round(qty / Math.max(min * 2, 1) * 100));
        const isLow = qty <= min;
        return (
          <div style={{ minWidth: isMobile ? 50 : 90 }}>
            <div style={{ fontWeight:700, fontSize: isMobile ? 13 : 14, color:isLow?'#ef4444':dm.text, marginBottom: isMobile ? 3 : 5 }}>{qty}</div>
            {!isMobile && (
              <div style={{ height:3, borderRadius:10, background:darkMode?'rgba(255,255,255,0.1)':'rgba(226,232,240,0.8)', overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', borderRadius:10, background:isLow?'#ef4444':'#10b981', transition:'width 0.6s ease' }}/>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'unit_price', header: 'PRICE',
      cell: ({ getValue }) => (
        <span style={{ fontWeight:700, fontSize: isMobile ? 12 : 13, color:dm.text }}>${parseFloat(getValue()||0).toFixed(2)}</span>
      ),
    },
    {
      id: 'value', header: 'VALUE',
      accessorFn: row => row.quantity * parseFloat(row.unit_price || 0),
      cell: ({ getValue }) => (
        <span style={{ fontWeight:700, fontSize:13, color:'#14b8a6' }}>${getValue().toFixed(2)}</span>
      ),
    },
    {
      id: 'supplier', header: 'SUPPLIER',
      accessorFn: row => suppliers.find(s => s.id === row.supplier_id)?.name || '—',
      cell: ({ getValue }) => <span style={{ fontSize:12, color:dm.muted, whiteSpace:'nowrap' }}>{getValue()}</span>,
    },
    {
      id: 'status', header: 'STATUS',
      accessorFn: row => row.quantity <= row.min_quantity ? (row.quantity === 0 ? 'Out' : 'Low') : 'OK',
      cell: ({ row }) => statusBadge(row.original.quantity, row.original.min_quantity || 10),
    },
    {
      id: 'actions', header: 'ACTIONS',
      cell: ({ row }) => {
        const p = row.original;
        const btns = [
          { icon:'bi-arrow-down-circle', grad:'linear-gradient(135deg,#10b981,#14b8a6)', glow:'rgba(16,185,129,0.4)', title:'Stock IN',  onClick: () => openTx(p, 'in')    },
          { icon:'bi-arrow-up-circle',   grad:'linear-gradient(135deg,#ef4444,#f97316)', glow:'rgba(239,68,68,0.4)',  title:'Stock OUT', onClick: () => openTx(p, 'out')   },
          { icon:'bi-pencil',            grad:'linear-gradient(135deg,#14b8a6,#6366f1)', glow:'rgba(20,184,166,0.4)', title:'Edit',      onClick: () => openEditForm(p)    },
          { icon:'bi-trash',             grad:'linear-gradient(135deg,#ef4444,#f97316)', glow:'rgba(239,68,68,0.4)',  title:'Delete',    onClick: () => handleDelete(p.id) },
        ];
        // mobile: only IN/OUT/Edit (hide delete to save space, or keep all 4 small)
        return (
          <div style={{ display:'flex', gap: isMobile ? 3 : 5 }}>
            {btns.map((btn, i) => (
              <button key={i} title={btn.title} onClick={btn.onClick}
                style={{ width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, borderRadius:7, border:`1px solid ${dm.border}`, background:'transparent', color:dm.muted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize: isMobile ? 10 : 12, transition:'all 0.15s', flexShrink:0 }}
                onMouseEnter={e => { e.currentTarget.style.background=btn.grad; e.currentTarget.style.color='#fff'; e.currentTarget.style.border='1px solid transparent'; e.currentTarget.style.boxShadow=`0 4px 12px ${btn.glow}`; }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=dm.muted; e.currentTarget.style.border=`1px solid ${dm.border}`; e.currentTarget.style.boxShadow='none'; }}>
                <i className={`bi ${btn.icon}`}></i>
              </button>
            ))}
          </div>
        );
      },
      enableSorting: false,
    },
  ], [products, suppliers, darkMode, tick, bp]);

  // ── Filter columns by breakpoint ──
  const visibleColumnIds = useMemo(() => {
    if (isMobile)   return ['product', 'quantity', 'status', 'actions'];
    if (isTablet)   return ['product', 'category', 'quantity', 'unit_price', 'status', 'actions'];
    if (isTabletLg) return ['product', 'category', 'quantity', 'unit_price', 'value', 'status', 'actions'];
    return ['product', 'category', 'quantity', 'unit_price', 'value', 'supplier', 'status', 'actions'];
  }, [bp]);

  const visibleColumns = useMemo(() =>
    columns.filter(c => visibleColumnIds.includes(c.id || c.accessorKey)),
    [columns, visibleColumnIds]
  );

  const table = useReactTable({
    data: products, columns: visibleColumns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: isMobile ? 8 : 10 } },
  });

  const openAddForm = () => {
    setEditProduct(null);
    setForm({ name:'', category:'', qty:'', price:'', supplier_id:'', description:'' });
    setModalImage(null);
    setShowAddForm(true);
  };

  const openEditForm = (p) => {
    setEditProduct(p);
    setForm({ name:p.name, category:p.category||'', qty:p.quantity, price:p.unit_price||'', supplier_id:p.supplier_id||'', description:p.description||'' });
    setModalImage(getProductImage(p.id));
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    const method = editProduct ? 'PUT' : 'POST';
    const url    = editProduct ? `${BASE_URL}/api/products/${editProduct.id}` : `${BASE_URL}/api/products`;
    fetch(url, {
      method, headers,
      body: JSON.stringify({ name:form.name, category:form.category||'General', qty:parseInt(form.qty)||0, price:parseFloat(form.price)||0, min_quantity:editProduct?.min_quantity||10 }),
    }).then(r => r.json()).then(data => {
      const productId = editProduct ? editProduct.id : data.id;
      if (productId) {
        if (modalImage) setProductImage(productId, modalImage);
        else if (!modalImage && editProduct) removeProductImage(productId);
      }
      setTick(t => t + 1);
      fetchProducts();
      setShowAddForm(false);
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this product?')) return;
    fetch(`${BASE_URL}/api/products/${id}`, { method:'DELETE', headers })
      .then(() => { removeProductImage(id); fetchProducts(); });
  };

  const openTx = (p, type) => {
    setSelectedProduct(p); setTxType(type); setTxQty(''); setTxNote(''); setShowTxForm(true);
  };

  const handleTxSubmit = () => {
    if (!txQty || parseInt(txQty) <= 0) return;
    fetch(`${BASE_URL}/api/transactions`, {
      method:'POST', headers,
      body: JSON.stringify({ product_id:selectedProduct.id, type:txType, quantity:parseInt(txQty), note:txNote }),
    }).then(() => { fetchProducts(); setShowTxForm(false); });
  };

  // ── Stats cols per breakpoint ──
  const statsCols = isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)';

  return (
    <div style={{ background:dm.bg, minHeight:'100vh', width:'100%', boxSizing:'border-box', overflowX:'hidden' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: isMobile ? 12 : 20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h4 style={{ fontWeight:800, margin:0, color:dm.text, fontSize: isMobile ? '1.05rem' : '1.4rem', letterSpacing:'-0.5px' }}>Inventory</h4>
          <div style={{ fontSize:12, color:dm.muted, marginTop:2 }}>
            Dashboard <i className="bi bi-chevron-right" style={{ fontSize:9, margin:'0 4px' }}></i>
            <span style={{ color:dm.text }}>Inventory</span>
          </div>
        </div>
        <button onClick={openAddForm}
          style={{ background:'linear-gradient(135deg,#14b8a6,#6366f1)', color:'#fff', border:'none', borderRadius:10, padding: isMobile ? '8px 14px' : '10px 20px', fontWeight:600, cursor:'pointer', fontSize: isMobile ? 12 : 13, display:'flex', alignItems:'center', gap:7, boxShadow:'0 4px 15px rgba(20,184,166,0.4)', fontFamily:'inherit', whiteSpace:'nowrap' }}>
          <i className="bi bi-plus-lg"></i>
          {isMobile ? 'Add' : 'Add Product'}
        </button>
      </div>

      {/* ── Stats: responsive cols ── */}
      <div style={{ display:'grid', gridTemplateColumns:statsCols, gap: isMobile ? 8 : 12, marginBottom: isMobile ? 12 : 16, width:'100%', boxSizing:'border-box' }}>
        {[
          { label:'Total Products', value:products.length,             icon:'bi-box-seam',            grad:'linear-gradient(135deg,#14b8a6,#6366f1)', glow:'rgba(20,184,166,0.3)' },
          { label:'Low Stock',      value:lowCount,                    icon:'bi-exclamation-triangle', grad:'linear-gradient(135deg,#f59e0b,#f97316)', glow:'rgba(245,158,11,0.3)' },
          { label:'Categories',     value:categories.length,           icon:'bi-tags',                 grad:'linear-gradient(135deg,#6366f1,#ec4899)', glow:'rgba(99,102,241,0.3)' },
          { label:'Total Value',    value:`$${totalValue.toFixed(0)}`, icon:'bi-cash-stack',           grad:'linear-gradient(135deg,#10b981,#14b8a6)', glow:'rgba(16,185,129,0.3)' },
        ].map((c, i) => (
          <div key={i} style={{ ...glass, borderRadius:16, padding: isMobile ? '10px 12px' : '14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 12px 30px ${c.glow}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=darkMode?'0 8px 32px rgba(0,0,0,0.3)':'0 8px 32px rgba(15,23,42,0.08)'; }}>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize: isMobile ? 9 : 11, color:dm.muted, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.label}</div>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight:800, color:dm.text, lineHeight:1 }}>{c.value}</div>
            </div>
            <div style={{ width: isMobile ? 34 : 42, height: isMobile ? 34 : 42, borderRadius:12, background:c.grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? 14 : 18, color:'#fff', boxShadow:`0 4px 15px ${c.glow}`, flexShrink:0, marginLeft:8 }}>
              <i className={`bi ${c.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Panel ── */}
      <div style={{ ...glass, borderRadius:20, overflow:'hidden', display:'flex', flexDirection:'column', width:'100%' }}>

        {/* Toolbar */}
        <div style={{ padding: isMobile ? '10px 12px' : '12px 16px', display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid ${dm.border}`, background:dm.card2, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, fontSize:13, color:dm.text, display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap' }}>
            <i className="bi bi-list-ul" style={{ color:'#14b8a6' }}></i>
            {!isMobile && 'Product List'}
          </span>
          <div style={{ flex:1 }}></div>

          {/* Search — full width on mobile */}
          <div style={{ position:'relative', width: isMobile ? '100%' : 200 }}>
            <i className="bi bi-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:dm.muted, fontSize:12, pointerEvents:'none' }}></i>
            <input style={{ ...inp, paddingLeft:32, fontSize:12 }} placeholder="Search products..."
              value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}/>
          </div>

          {/* Filters: show on tablet+ */}
          {!isMobile && (
            <>
              <select style={{ ...inp, width:'auto', padding:'7px 10px' }}
                onChange={e => setColumnFilters(e.target.value ? [{ id:'category', value:e.target.value }] : [])}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select style={{ ...inp, width:'auto', padding:'7px 10px' }}
                onChange={e => setColumnFilters(prev => {
                  const without = prev.filter(f => f.id !== 'status');
                  return e.target.value ? [...without, { id:'status', value:e.target.value }] : without;
                })}>
                <option value="">All Status</option>
                <option value="OK">In Stock</option>
                <option value="Low">Low Stock</option>
                <option value="Out">Out of Stock</option>
              </select>
              {/* Show page size only on desktop */}
              {!isSmall && (
                <select style={{ ...inp, width:'auto', padding:'7px 10px' }}
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}>
                  {[5,10,20,50].map(s => <option key={s} value={s}>Show {s}</option>)}
                </select>
              )}
            </>
          )}
        </div>

        {/* ── Table ── */}
        <div style={{ overflowX:'auto', flex:1, WebkitOverflowScrolling:'touch' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:50, color:dm.muted }}>
              <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid rgba(20,184,166,0.2)', borderTop:'3px solid #14b8a6', animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }}/>
              <div style={{ fontSize:13 }}>Loading products...</div>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth: isMobile ? 360 : isTablet ? 520 : isTabletLg ? 680 : 780 }}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id} style={{ background:dm.card2 }}>
                    {hg.headers.map(header => (
                      <th key={header.id}
                        style={{ padding: isMobile ? '8px 10px' : '10px 14px', fontSize:10, fontWeight:700, color:dm.muted, textTransform:'uppercase', letterSpacing:'0.07em', borderBottom:`1px solid ${dm.border}`, textAlign:'left', whiteSpace:'nowrap', cursor:header.column.getCanSort()?'pointer':'default', userSelect:'none' }}
                        onClick={header.column.getToggleSortingHandler()}
                        onMouseEnter={e => { if(header.column.getCanSort()) e.currentTarget.style.color='#14b8a6'; }}
                        onMouseLeave={e => { e.currentTarget.style.color=dm.muted; }}>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span style={{ fontSize:10, opacity:0.5 }}>
                              {header.column.getIsSorted()==='asc'?' ↑':header.column.getIsSorted()==='desc'?' ↓':' ↕'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr><td colSpan={visibleColumns.length} style={{ textAlign:'center', padding:60, color:dm.muted }}>
                    <i className="bi bi-box-seam" style={{ fontSize:40, display:'block', marginBottom:10, opacity:0.3 }}></i>
                    No products found
                  </td></tr>
                ) : table.getRowModel().rows.map(row => (
                  <tr key={row.id}
                    style={{ borderBottom:`1px solid ${dm.border}`, transition:'all 0.15s ease', borderLeft:'3px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background=dm.hover; e.currentTarget.style.borderLeft='3px solid #14b8a6'; e.currentTarget.style.transform='translateX(2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderLeft='3px solid transparent'; e.currentTarget.style.transform='translateX(0)'; }}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} style={{ padding: isMobile ? '9px 10px' : '12px 14px', verticalAlign:'middle' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        <div style={{ padding: isMobile ? '9px 12px' : '11px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:`1px solid ${dm.border}`, background:dm.card2, flexWrap:'wrap', gap:8 }}>
          <span style={{ fontSize:11, color:dm.muted }}>
            Page <span style={{ fontWeight:600, color:dm.text }}>{table.getState().pagination.pageIndex+1}</span>
            {' '}/ <span style={{ fontWeight:600, color:dm.text }}>{table.getPageCount()||1}</span>
            {!isMobile && <> — <span style={{ fontWeight:600, color:dm.text }}>{table.getFilteredRowModel().rows.length}</span> results</>}
          </span>
          <div style={{ display:'flex', gap:3 }}>
            {[
              { label:'«', onClick:()=>table.setPageIndex(0),          disabled:!table.getCanPreviousPage() },
              { icon:'bi-chevron-left', onClick:()=>table.previousPage(), disabled:!table.getCanPreviousPage() },
            ].map((btn,i) => (
              <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                style={{ border:`1px solid ${dm.border}`, background:dm.card, borderRadius:8, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', cursor:btn.disabled?'not-allowed':'pointer', color:btn.disabled?dm.muted:dm.text, fontSize:10, transition:'all 0.15s' }}
                onMouseEnter={e=>{ if(!btn.disabled){e.currentTarget.style.background='linear-gradient(135deg,#14b8a6,#6366f1)';e.currentTarget.style.color='#fff';e.currentTarget.style.border='1px solid transparent';}}}
                onMouseLeave={e=>{e.currentTarget.style.background=dm.card;e.currentTarget.style.color=dm.muted;e.currentTarget.style.border=`1px solid ${dm.border}`;}}>
                {btn.icon ? <i className={`bi ${btn.icon}`} style={{ fontSize:9 }}></i> : btn.label}
              </button>
            ))}
            {Array.from({ length: Math.min(isMobile ? 3 : 5, table.getPageCount()) }, (_, i) => {
              const pageIdx = Math.max(0, Math.min(table.getState().pagination.pageIndex - (isMobile?1:2), table.getPageCount() - (isMobile?3:5))) + i;
              if (pageIdx < 0 || pageIdx >= table.getPageCount()) return null;
              const isActive = pageIdx === table.getState().pagination.pageIndex;
              return (
                <button key={pageIdx} onClick={() => table.setPageIndex(pageIdx)}
                  style={{ border:`1px solid ${isActive?'transparent':dm.border}`, background:isActive?'linear-gradient(135deg,#14b8a6,#6366f1)':dm.card, color:isActive?'#fff':dm.muted, borderRadius:8, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontWeight:isActive?700:400, fontSize:11, transition:'all 0.15s' }}>
                  {pageIdx+1}
                </button>
              );
            })}
            {[
              { icon:'bi-chevron-right', onClick:()=>table.nextPage(),                          disabled:!table.getCanNextPage() },
              { label:'»',              onClick:()=>table.setPageIndex(table.getPageCount()-1), disabled:!table.getCanNextPage() },
            ].map((btn,i) => (
              <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                style={{ border:`1px solid ${dm.border}`, background:dm.card, borderRadius:8, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', cursor:btn.disabled?'not-allowed':'pointer', color:btn.disabled?dm.muted:dm.text, fontSize:10, transition:'all 0.15s' }}
                onMouseEnter={e=>{ if(!btn.disabled){e.currentTarget.style.background='linear-gradient(135deg,#14b8a6,#6366f1)';e.currentTarget.style.color='#fff';e.currentTarget.style.border='1px solid transparent';}}}
                onMouseLeave={e=>{e.currentTarget.style.background=dm.card;e.currentTarget.style.color=dm.muted;e.currentTarget.style.border=`1px solid ${dm.border}`;}}>
                {btn.icon ? <i className={`bi ${btn.icon}`} style={{ fontSize:9 }}></i> : btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      {showAddForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile ? 10 : 20 }}>
          <div style={{ ...glass, borderRadius: isMobile ? 16 : 24, width: isMobile ? '100%' : isTablet ? '90%' : 560, maxHeight: isMobile ? '94vh' : '90vh', overflowY:'auto', boxShadow:'0 30px 80px rgba(0,0,0,0.5)' }}>

            {/* Header */}
            <div style={{ padding: isMobile ? '12px 14px' : '20px 24px', borderBottom:`1px solid ${dm.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:dm.card2, borderRadius: isMobile ? '16px 16px 0 0' : '24px 24px 0 0', position:'sticky', top:0, zIndex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#14b8a6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className={`bi bi-${editProduct?'pencil':'plus-lg'}`} style={{ color:'#fff', fontSize:13 }}></i>
                </div>
                <div>
                  <h5 style={{ margin:0, fontWeight:700, color:dm.text, fontSize:13 }}>{editProduct?'Edit Product':'Add New Product'}</h5>
                  <div style={{ fontSize:10, color:dm.muted, marginTop:1 }}>Fill in the product information</div>
                </div>
              </div>
              <button onClick={() => setShowAddForm(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:dm.muted, fontSize:22, lineHeight:1 }}>
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div style={{ padding: isMobile ? '12px 14px' : '20px 24px' }}>
              {/* Image Upload */}
              <div style={{ marginBottom:16, padding:12, background:darkMode?'rgba(20,184,166,0.05)':'rgba(20,184,166,0.04)', borderRadius:12, border:'1px solid rgba(20,184,166,0.15)' }}>
                <div style={{ fontSize:10, fontWeight:700, color:dm.muted, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  <i className="bi bi-image" style={{ marginRight:6, color:'#14b8a6' }}></i>Product Image
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <div style={{ width:60, height:60, borderRadius:12, overflow:'hidden', flexShrink:0, background:modalImage?'none':'linear-gradient(135deg,#14b8a6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${modalImage?'rgba(20,184,166,0.4)':dm.border}` }}>
                    {modalImage
                      ? <img src={modalImage} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <i className="bi bi-image" style={{ fontSize:22, opacity:0.6, color:'#fff' }}></i>
                    }
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:dm.text, fontWeight:600, marginBottom:7 }}>
                      {modalImage ? 'Image selected ✓' : 'No image selected'}
                    </div>
                    <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                      <label htmlFor="productImgInput" style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:8, cursor:'pointer', background:'linear-gradient(135deg,#14b8a6,#6366f1)', color:'#fff', fontSize:11, fontWeight:700 }}>
                        <i className="bi bi-upload"></i>{modalImage ? 'Change' : 'Upload'}
                      </label>
                      <input id="productImgInput" type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageUpload} ref={imgInputRef} />
                      {modalImage && (
                        <button onClick={() => setModalImage(null)}
                          style={{ padding:'5px 10px', borderRadius:8, border:'1px solid rgba(239,68,68,0.3)', background:'transparent', color:'#ef4444', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                          <i className="bi bi-trash"></i> Remove
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize:10, color:dm.muted, marginTop:5 }}>
                      JPG, PNG — Max 5MB <span style={{ color:'#14b8a6' }}>(auto-compressed)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields — 2col on tablet+, 1col on mobile */}
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 10 : 12 }}>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Product Name *</label>
                  <input style={inp} placeholder="e.g. iPhone 15 Pro"
                    value={form.name} onChange={e => setForm({ ...form, name:e.target.value })}/>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Category</label>
                  <input style={inp} placeholder="e.g. iPhone, Samsung..."
                    value={form.category} onChange={e => setForm({ ...form, category:e.target.value })}/>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Supplier</label>
                  <select style={inp} value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id:e.target.value })}>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    Quantity {editProduct && <span style={{ color:dm.muted, fontWeight:400, textTransform:'none', fontSize:10 }}>(use IN/OUT)</span>}
                  </label>
                  <input style={{ ...inp, opacity:editProduct?0.5:1 }} type="number" placeholder="0"
                    value={form.qty} onChange={e => setForm({ ...form, qty:e.target.value })} disabled={!!editProduct}/>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Price ($)</label>
                  <input style={inp} type="number" step="0.01" placeholder="0.00"
                    value={form.price} onChange={e => setForm({ ...form, price:e.target.value })}/>
                </div>
              </div>
            </div>

            <div style={{ padding: isMobile ? '10px 14px 14px' : '14px 24px 20px', display:'flex', gap:8, borderTop:`1px solid ${dm.border}` }}>
              <button onClick={handleSave}
                style={{ flex:1, padding:'11px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#14b8a6,#6366f1)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:'0 4px 15px rgba(20,184,166,0.4)', fontFamily:'inherit' }}>
                <i className="bi bi-check-lg"></i>{editProduct?'Update':'Save Product'}
              </button>
              <button onClick={() => setShowAddForm(false)}
                style={{ flex:1, padding:'11px', borderRadius:12, border:`1px solid ${dm.border}`, background:'transparent', color:dm.text, fontWeight:600, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stock In/Out Modal ── */}
      {showTxForm && selectedProduct && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile ? 10 : 20 }}>
          <div style={{ ...glass, borderRadius: isMobile ? 16 : 24, width: isMobile ? '100%' : 440, boxShadow:'0 30px 80px rgba(0,0,0,0.5)', overflow:'hidden' }}>
            <div style={{ padding: isMobile ? '12px 14px' : '20px 24px', borderBottom:`1px solid ${dm.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:dm.card2, borderRadius: isMobile ? '16px 16px 0 0' : '24px 24px 0 0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:10, overflow:'hidden', background:getProductImage(selectedProduct.id)?'none':'linear-gradient(135deg,#14b8a6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {getProductImage(selectedProduct.id)
                    ? <img src={getProductImage(selectedProduct.id)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : selectedProduct.name?.slice(0,2).toUpperCase()
                  }
                </div>
                <div>
                  <h5 style={{ margin:0, fontWeight:700, color:dm.text, fontSize:13 }}>Stock {txType==='in'?'IN':'OUT'}</h5>
                  <div style={{ fontSize:11, color:dm.muted, marginTop:1 }}>{selectedProduct.name}</div>
                </div>
              </div>
              <button onClick={() => setShowTxForm(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:dm.muted, fontSize:22, lineHeight:1 }}>
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div style={{ padding: isMobile ? '14px' : '20px 24px' }}>
              <div style={{ display:'flex', gap:8, marginBottom:14, background:dm.card2, borderRadius:12, padding:4, border:`1px solid ${dm.border}` }}>
                {['in','out'].map(t => (
                  <button key={t} onClick={() => setTxType(t)}
                    style={{ flex:1, padding:'8px', borderRadius:9, border:'none', cursor:'pointer', fontWeight:600, fontSize: isMobile ? 12 : 13, fontFamily:'inherit', transition:'all 0.2s', background:txType===t?(t==='in'?'linear-gradient(135deg,#10b981,#14b8a6)':'linear-gradient(135deg,#ef4444,#f97316)'):'transparent', color:txType===t?'#fff':dm.muted, boxShadow:txType===t?`0 4px 12px ${t==='in'?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'}`:'none' }}>
                    <i className={`bi bi-arrow-${t==='in'?'down':'up'}`} style={{ marginRight:6 }}></i>
                    Stock {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  Quantity <span style={{ color:dm.muted, fontWeight:400, textTransform:'none' }}>(Current: {selectedProduct.quantity})</span>
                </label>
                <input style={{ ...inp, fontSize:'1.1rem', padding:12, textAlign:'center', fontWeight:700 }}
                  type="number" min="1" placeholder="0" value={txQty} onChange={e => setTxQty(e.target.value)} autoFocus/>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:dm.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Note (optional)</label>
                <input style={inp} placeholder="e.g. Received from supplier..." value={txNote} onChange={e => setTxNote(e.target.value)}/>
              </div>
            </div>

            <div style={{ padding: isMobile ? '10px 14px 14px' : '14px 24px 20px', display:'flex', gap:8, borderTop:`1px solid ${dm.border}` }}>
              <button onClick={handleTxSubmit}
                style={{ flex:1, padding:'11px', borderRadius:12, border:'none', background:txType==='in'?'linear-gradient(135deg,#10b981,#14b8a6)':'linear-gradient(135deg,#ef4444,#f97316)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'inherit' }}>
                <i className="bi bi-check-lg"></i>Confirm
              </button>
              <button onClick={() => setShowTxForm(false)}
                style={{ flex:1, padding:'11px', borderRadius:12, border:`1px solid ${dm.border}`, background:'transparent', color:dm.text, fontWeight:600, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.4)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}