import React, { useState, useEffect } from 'react';
import CambodiaMap from '../components/CambodiaMap';

const BASE_URL  = 'https://stockpro-backend-production-8344.up.railway.app';
const PAGE_SIZE = 8;

const CAT_COLORS = {
  'food':      { bg:'rgba(16,185,129,0.15)', color:'#10b981', border:'rgba(16,185,129,0.3)' },
  'drink':     { bg:'rgba(20,184,166,0.15)', color:'#14b8a6', border:'rgba(20,184,166,0.3)' },
  'iPhone':    { bg:'rgba(99,102,241,0.15)', color:'#6366f1', border:'rgba(99,102,241,0.3)' },
  'Samsung':   { bg:'rgba(245,158,11,0.15)', color:'#f59e0b', border:'rgba(245,158,11,0.3)' },
  'Vivo':      { bg:'rgba(20,184,166,0.15)', color:'#14b8a6', border:'rgba(20,184,166,0.3)' },
  'OPPO':      { bg:'rgba(245,158,11,0.15)', color:'#f59e0b', border:'rgba(245,158,11,0.3)' },
  'Apple':     { bg:'rgba(100,116,139,0.15)', color:'#64748b', border:'rgba(100,116,139,0.3)' },
  'skin care': { bg:'rgba(236,72,153,0.15)', color:'#ec4899', border:'rgba(236,72,153,0.3)' },
  'book':      { bg:'rgba(249,115,22,0.15)', color:'#f97316', border:'rgba(249,115,22,0.3)' },
  'General':   { bg:'rgba(100,116,139,0.15)', color:'#64748b', border:'rgba(100,116,139,0.3)' },
};

const DELIVERY_COLORS = {
  'DHL':           { bg:'rgba(245,158,11,0.15)', color:'#f59e0b', border:'rgba(245,158,11,0.3)', icon:'🚡' },
  'FedEx':         { bg:'rgba(99,102,241,0.15)', color:'#6366f1', border:'rgba(99,102,241,0.3)', icon:'✈️' },
  'J&T':           { bg:'rgba(20,184,166,0.15)', color:'#14b8a6', border:'rgba(20,184,166,0.3)', icon:'🚚' },
  'J&T Express':   { bg:'rgba(20,184,166,0.15)', color:'#14b8a6', border:'rgba(20,184,166,0.3)', icon:'🚚' },
  'Flash Express': { bg:'rgba(239,68,68,0.15)',  color:'#ef4444', border:'rgba(239,68,68,0.3)',  icon:'⚡' },
  'Kerry Express': { bg:'rgba(249,115,22,0.15)', color:'#f97316', border:'rgba(249,115,22,0.3)', icon:'📦' },
  'Cambodia Post': { bg:'rgba(99,102,241,0.15)', color:'#6366f1', border:'rgba(99,102,241,0.3)', icon:'📮' },
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#14b8a6,#6366f1)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#6366f1,#ec4899)',
  'linear-gradient(135deg,#10b981,#14b8a6)',
  'linear-gradient(135deg,#f97316,#f59e0b)',
  'linear-gradient(135deg,#ec4899,#6366f1)',
  'linear-gradient(135deg,#64748b,#334155)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)',
];

export default function SuppliersPage({ darkMode }) {
  const [suppliers, setSuppliers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [activeTab, setActiveTab]       = useState('all');
  const [search, setSearch]             = useState('');
  const [filterCat, setFilterCat]       = useState('');
  const [filterDelivery, setFilterDelivery] = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showMap, setShowMap]           = useState(true);
  const [windowWidth, setWindowWidth]   = useState(window.innerWidth);
  const [form, setForm] = useState({
    name:'', contact_name:'', phone:'', email:'',
    address:'', category:'', status:'active',
    delivery_company:'', rating:5,
  });

  const token   = localStorage.getItem('token');
  const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };

  // ── Responsive breakpoints ──
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth < 1024;

  // Auto-hide map on mobile
  useEffect(() => {
    if (isMobile) setShowMap(false);
  }, [isMobile]);

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
    backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
    background:dm.card, border:`1px solid ${dm.border}`,
    boxShadow:darkMode?'0 8px 32px rgba(0,0,0,0.3)':'0 8px 32px rgba(15,23,42,0.08)',
  };

  const inp = {
    background:dm.input, border:`1px solid ${dm.border}`,
    color:dm.text, borderRadius:10, padding:'8px 12px',
    width:'100%', outline:'none', fontSize:'13px',
    fontFamily:'inherit', transition:'all 0.2s',
  };

  const fetchSuppliers = () => {
    setLoading(true);
    fetch(`${BASE_URL}/api/suppliers`, { headers })
      .then(r=>r.json())
      .then(d=>{ if(Array.isArray(d)) setSuppliers(d); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{ fetchSuppliers(); },[]);

  const categories    = [...new Set(suppliers.map(s=>s.category||'General'))];
  const deliveries    = [...new Set(suppliers.map(s=>s.delivery_company).filter(Boolean))];
  const activeCount   = suppliers.filter(s=>(s.status||'active')==='active').length;
  const inactiveCount = suppliers.filter(s=>s.status==='inactive').length;
  const pendingCount  = suppliers.filter(s=>s.status==='pending').length;

  const filtered = suppliers.filter(s=>{
    const matchTab  = activeTab==='all'||(s.status||'active')===activeTab;
    const matchSrch = search ? s.name.toLowerCase().includes(search.toLowerCase())||(s.contact_name||'').toLowerCase().includes(search.toLowerCase()) : true;
    const matchCat  = filterCat      ? (s.category||'General')===filterCat   : true;
    const matchDlv  = filterDelivery ? s.delivery_company===filterDelivery   : true;
    return matchTab && matchSrch && matchCat && matchDlv;
  });

  const totalPages = Math.ceil(filtered.length/PAGE_SIZE);
  const paginated  = filtered.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

  const openAdd = () => {
    setEditSupplier(null);
    setForm({name:'',contact_name:'',phone:'',email:'',address:'',category:'',status:'active',delivery_company:'',rating:5});
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditSupplier(s);
    setForm({name:s.name,contact_name:s.contact_name||'',phone:s.phone||'',email:s.email||'',address:s.address||'',category:s.category||'',status:s.status||'active',delivery_company:s.delivery_company||'',rating:s.rating||5});
    setShowForm(true);
  };

  const handleSave = () => {
    if(!form.name) return;
    const method = editSupplier?'PUT':'POST';
    const url    = editSupplier?`${BASE_URL}/api/suppliers/${editSupplier.id}`:`${BASE_URL}/api/suppliers`;
    fetch(url,{method,headers,body:JSON.stringify(form)}).then(()=>{fetchSuppliers();setShowForm(false);});
  };

  const handleDelete = (id) => {
    if(!window.confirm('Delete this supplier?')) return;
    fetch(`${BASE_URL}/api/suppliers/${id}`,{method:'DELETE',headers}).then(()=>{fetchSuppliers();setSelectedSupplier(null);});
  };

  const statusBadge = (status) => {
    const s=status||'active';
    const cfg={active:{color:'#10b981',glow:'rgba(16,185,129,0.4)',label:'Active'},inactive:{color:'#64748b',glow:'rgba(100,116,139,0.3)',label:'Inactive'},pending:{color:'#f59e0b',glow:'rgba(245,158,11,0.4)',label:'Pending'}};
    const c=cfg[s]||cfg.active;
    return (
      <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:`${c.color}15`,color:c.color,border:`1px solid ${c.color}30`}}>
        <span style={{width:6,height:6,borderRadius:'50%',background:c.color,flexShrink:0,boxShadow:`0 0 6px ${c.glow}`,animation:s==='active'?'pulse 2s infinite':'none'}}/>
        {c.label}
      </span>
    );
  };

  const deliveryBadge = (name) => {
    if(!name) return <span style={{color:dm.muted,fontSize:12}}>—</span>;
    const dc=DELIVERY_COLORS[name]||{bg:'rgba(20,184,166,0.15)',color:'#14b8a6',border:'rgba(20,184,166,0.3)',icon:'🚚'};
    return (
      <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:8,fontSize:11,fontWeight:600,background:dc.bg,color:dc.color,border:`1px solid ${dc.border}`,whiteSpace:'nowrap'}}>
        {dc.icon} {name}
      </span>
    );
  };

  const catBadge = (cat) => {
    const c=CAT_COLORS[cat]||CAT_COLORS['General'];
    return (
      <span style={{display:'inline-flex',alignItems:'center',padding:'3px 9px',borderRadius:8,fontSize:11,fontWeight:600,background:c.bg,color:c.color,border:`1px solid ${c.border}`,whiteSpace:'nowrap'}}>
        {cat||'General'}
      </span>
    );
  };

  const stars = (r) => Array.from({length:5},(_,i)=>(
    <i key={i} className={`bi bi-star${i<Math.round(r||0)?'-fill':''}`}
      style={{fontSize:10,color:i<Math.round(r||0)?'#f59e0b':'rgba(100,116,139,0.3)'}}></i>
  ));

  return (
    <div style={{background:dm.bg,minHeight:'100vh'}}>

      {/* ── Header ── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <h4 style={{fontWeight:800,margin:0,color:dm.text,fontSize:isMobile?'1.2rem':'1.4rem',letterSpacing:'-0.5px'}}>Suppliers</h4>
          <div style={{fontSize:12,color:dm.muted,marginTop:2}}>
            Dashboard <i className="bi bi-chevron-right" style={{fontSize:9,margin:'0 4px'}}></i>
            <span style={{color:dm.text}}>Suppliers</span>
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={()=>setShowMap(m=>!m)}
            style={{...glass,border:`1px solid ${dm.border}`,borderRadius:10,padding:'8px 12px',color:dm.muted,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',gap:5,fontFamily:'inherit',fontWeight:500}}>
            <i className={`bi bi-${showMap?'eye-slash':'map'}`}></i>
            {!isMobile&&(showMap?'Hide Map':'Show Map')}
          </button>
          <button onClick={openAdd}
            style={{background:'linear-gradient(135deg,#14b8a6,#6366f1)',color:'#fff',border:'none',borderRadius:10,padding:isMobile?'8px 12px':'10px 18px',fontWeight:600,cursor:'pointer',fontSize:isMobile?12:13,display:'flex',alignItems:'center',gap:6,boxShadow:'0 4px 15px rgba(20,184,166,0.4)',fontFamily:'inherit'}}>
            <i className="bi bi-plus-lg"></i>{!isMobile&&'Add Supplier'}
          </button>
        </div>
      </div>

      {/* ── Stats — Responsive Grid ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(3,1fr)' : 'repeat(5,1fr)',
        gap:10, marginBottom:14,
      }}>
        {[
          {label:'Total',     value:suppliers.length,  icon:'bi-building',    grad:'linear-gradient(135deg,#14b8a6,#6366f1)',glow:'rgba(20,184,166,0.3)'},
          {label:'Active',    value:activeCount,       icon:'bi-check-circle',grad:'linear-gradient(135deg,#10b981,#14b8a6)',glow:'rgba(16,185,129,0.3)'},
          {label:'Inactive',  value:inactiveCount,     icon:'bi-x-circle',    grad:'linear-gradient(135deg,#64748b,#475569)',glow:'rgba(100,116,139,0.2)'},
          {label:'Pending',   value:pendingCount,      icon:'bi-clock',       grad:'linear-gradient(135deg,#f59e0b,#f97316)',glow:'rgba(245,158,11,0.3)'},
          {label:'Categories',value:categories.length, icon:'bi-tag',         grad:'linear-gradient(135deg,#6366f1,#ec4899)',glow:'rgba(99,102,241,0.3)'},
        ].map((c,i)=>(
          <div key={i} style={{...glass,borderRadius:14,padding:isMobile?'12px':' 14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 10px 25px ${c.glow}`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=darkMode?'0 8px 32px rgba(0,0,0,0.3)':'0 8px 32px rgba(15,23,42,0.08)';}}>
            <div>
              <div style={{fontSize:isMobile?9:10,color:dm.muted,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600}}>{c.label}</div>
              <div style={{fontSize:isMobile?18:22,fontWeight:800,color:dm.text,lineHeight:1}}>{c.value}</div>
            </div>
            <div style={{width:isMobile?34:40,height:isMobile?34:40,borderRadius:isMobile?10:12,background:c.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?15:18,color:'#fff',boxShadow:`0 4px 12px ${c.glow}`,flexShrink:0}}>
              <i className={`bi ${c.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid — Responsive ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns: showMap && !isTablet ? '1fr 320px' : '1fr',
        gap:14,
      }}>

        {/* ── Table Panel ── */}
        <div style={{...glass,borderRadius:20,overflow:'hidden',display:'flex',flexDirection:'column'}}>

          {/* Toolbar — Responsive */}
          <div style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:8,borderBottom:`1px solid ${dm.border}`,background:dm.card2,flexWrap:'wrap'}}>
            <span style={{fontWeight:700,fontSize:13,color:dm.text,display:'flex',alignItems:'center',gap:6}}>
              <i className="bi bi-list-ul" style={{color:'#14b8a6'}}></i>
              {!isMobile&&'Supplier List'}
            </span>
            <div style={{flex:1}}></div>
            {/* Search */}
            <div style={{position:'relative',width:isMobile?'100%':'auto',order:isMobile?1:0}}>
              <i className="bi bi-search" style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:dm.muted,fontSize:12,pointerEvents:'none'}}></i>
              <input style={{...inp,paddingLeft:30,width:isMobile?'100%':160}} placeholder="Search supplier..."
                value={search} onChange={e=>{setSearch(e.target.value);setCurrentPage(1);}}/>
            </div>
            {/* Filters — hide on mobile to save space */}
            {!isMobile && (
              <>
                <select style={{...inp,width:'auto',padding:'7px 10px'}}
                  value={filterCat} onChange={e=>{setFilterCat(e.target.value);setCurrentPage(1);}}>
                  <option value="">All Categories</option>
                  {categories.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select style={{...inp,width:'auto',padding:'7px 10px'}}
                  value={filterDelivery} onChange={e=>{setFilterDelivery(e.target.value);setCurrentPage(1);}}>
                  <option value="">All Delivery</option>
                  {deliveries.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </>
            )}
          </div>

          {/* Mobile Filters Row */}
          {isMobile && (
            <div style={{padding:'8px 14px',display:'flex',gap:6,borderBottom:`1px solid ${dm.border}`,background:dm.card2}}>
              <select style={{...inp,flex:1,padding:'6px 8px',fontSize:12}}
                value={filterCat} onChange={e=>{setFilterCat(e.target.value);setCurrentPage(1);}}>
                <option value="">All Categories</option>
                {categories.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <select style={{...inp,flex:1,padding:'6px 8px',fontSize:12}}
                value={filterDelivery} onChange={e=>{setFilterDelivery(e.target.value);setCurrentPage(1);}}>
                <option value="">All Delivery</option>
                {deliveries.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {/* Tabs — Scrollable on mobile */}
          <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch',borderBottom:`1px solid ${dm.border}`,background:dm.card2}}>
            <div style={{display:'flex',gap:3,padding:'8px 14px',minWidth:'max-content'}}>
              {[
                {key:'all',label:'All',count:suppliers.length},
                {key:'active',label:'Active',count:activeCount},
                {key:'inactive',label:'Inactive',count:inactiveCount},
                {key:'pending',label:'Pending',count:pendingCount},
              ].map(tab=>(
                <button key={tab.key} onClick={()=>{setActiveTab(tab.key);setCurrentPage(1);}}
                  style={{padding:'5px 12px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',border:'none',fontFamily:'inherit',transition:'all 0.15s',whiteSpace:'nowrap',
                    background:activeTab===tab.key?'linear-gradient(135deg,#14b8a6,#6366f1)':'transparent',
                    color:activeTab===tab.key?'#fff':dm.muted,
                    boxShadow:activeTab===tab.key?'0 4px 12px rgba(20,184,166,0.3)':'none',
                  }}>
                  {tab.label}
                  <span style={{marginLeft:4,background:activeTab===tab.key?'rgba(255,255,255,0.25)':(darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'),color:activeTab===tab.key?'#fff':dm.muted,padding:'1px 6px',borderRadius:10,fontSize:10}}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table — Horizontal Scroll */}
          <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch',flex:1}}>
            {loading ? (
              <div style={{textAlign:'center',padding:50,color:dm.muted}}>
                <div className="spinner-border" style={{width:32,height:32,borderColor:'#14b8a6',borderRightColor:'transparent'}}/>
                <div style={{marginTop:10,fontSize:13}}>Loading suppliers...</div>
              </div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:isMobile?480:680}}>
                <thead>
                  <tr style={{background:dm.card2}}>
                    {(isMobile
                      ? ['SUPPLIER','CONTACT','STATUS','']
                      : ['SUPPLIER','CATEGORY','CONTACT','DELIVERY CO.','RATING','STATUS','ACTIONS']
                    ).map(h=>(
                      <th key={h} style={{padding:'9px 12px',fontSize:10,fontWeight:700,color:dm.muted,textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:`1px solid ${dm.border}`,textAlign:'left',whiteSpace:'nowrap'}}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length===0 ? (
                    <tr><td colSpan={7} style={{textAlign:'center',padding:'50px',color:dm.muted}}>
                      <i className="bi bi-building" style={{fontSize:36,display:'block',marginBottom:8,opacity:0.3}}></i>
                      No suppliers found
                    </td></tr>
                  ) : paginated.map((s,i)=>{
                    const grad    = AVATAR_GRADIENTS[i%AVATAR_GRADIENTS.length];
                    const isSel   = selectedSupplier?.id===s.id;
                    const initials = s.name?.slice(0,2).toUpperCase()||'??';
                    return (
                      <tr key={s.id}
                        style={{borderBottom:`1px solid ${dm.border}`,cursor:'pointer',transition:'all 0.15s ease',borderLeft:'3px solid transparent',background:isSel?(darkMode?'rgba(20,184,166,0.1)':'rgba(20,184,166,0.05)'):'transparent'}}
                        onMouseEnter={e=>{if(!isSel){e.currentTarget.style.background=dm.hover;e.currentTarget.style.borderLeft='3px solid #14b8a6';e.currentTarget.style.transform='translateX(1px)';}}}
                        onMouseLeave={e=>{if(!isSel){e.currentTarget.style.background='transparent';e.currentTarget.style.borderLeft='3px solid transparent';e.currentTarget.style.transform='translateX(0)';}}}
                        onClick={()=>setSelectedSupplier(isSel?null:s)}>

                        {/* Supplier */}
                        <td style={{padding:'11px 12px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:9}}>
                            <div style={{width:isMobile?30:34,height:isMobile?30:34,borderRadius:9,background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?11:13,fontWeight:700,color:'#fff',flexShrink:0,boxShadow:'0 4px 10px rgba(0,0,0,0.2)',position:'relative'}}>
                              {initials}
                              {(s.status||'active')==='active'&&(
                                <span style={{position:'absolute',bottom:-2,right:-2,width:9,height:9,borderRadius:'50%',background:'#10b981',border:`2px solid ${darkMode?'#0f172a':'#fff'}`,boxShadow:'0 0 5px rgba(16,185,129,0.6)'}}/>
                              )}
                            </div>
                            <div>
                              <div style={{fontWeight:700,fontSize:isMobile?12:13,color:dm.text,whiteSpace:'nowrap'}}>{s.name}</div>
                              {!isMobile&&<div style={{fontSize:10,color:dm.muted,fontFamily:'monospace'}}>SUP-{String(s.id).padStart(3,'0')}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Category — hide on mobile */}
                        {!isMobile&&<td style={{padding:'11px 12px'}}>{catBadge(s.category)}</td>}

                        {/* Contact */}
                        <td style={{padding:'11px 12px'}}>
                          <div style={{fontSize:isMobile?11:13,fontWeight:500,color:dm.text,whiteSpace:'nowrap'}}>{s.contact_name||'—'}</div>
                          {!isMobile&&<div style={{fontSize:11,color:dm.muted,display:'flex',alignItems:'center',gap:3,marginTop:2}}>
                            <i className="bi bi-telephone" style={{fontSize:9,color:'#14b8a6'}}></i>{s.phone||''}
                          </div>}
                        </td>

                        {/* Delivery — hide on mobile */}
                        {!isMobile&&<td style={{padding:'11px 12px'}}>{deliveryBadge(s.delivery_company)}</td>}

                        {/* Rating — hide on mobile */}
                        {!isMobile&&<td style={{padding:'11px 12px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:2}}>
                            {stars(s.rating||5)}
                            <span style={{fontSize:10,color:dm.muted,marginLeft:2,fontFamily:'monospace'}}>{parseFloat(s.rating||5).toFixed(1)}</span>
                          </div>
                        </td>}

                        {/* Status */}
                        <td style={{padding:'11px 12px'}}>{statusBadge(s.status)}</td>

                        {/* Actions */}
                        <td style={{padding:'11px 12px'}}>
                          <div style={{display:'flex',gap:4}}>
                            {[
                              {icon:'bi-pencil',grad:'linear-gradient(135deg,#14b8a6,#6366f1)',glow:'rgba(20,184,166,0.4)',onClick:(e)=>{e.stopPropagation();openEdit(s);}},
                              {icon:'bi-trash', grad:'linear-gradient(135deg,#ef4444,#f97316)',glow:'rgba(239,68,68,0.4)', onClick:(e)=>{e.stopPropagation();handleDelete(s.id);}},
                            ].map((btn,bi)=>(
                              <button key={bi} onClick={btn.onClick}
                                style={{width:26,height:26,borderRadius:7,border:`1px solid ${dm.border}`,background:'transparent',color:dm.muted,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:11,transition:'all 0.15s'}}
                                onMouseEnter={e=>{e.currentTarget.style.background=btn.grad;e.currentTarget.style.color='#fff';e.currentTarget.style.border='1px solid transparent';e.currentTarget.style.boxShadow=`0 4px 10px ${btn.glow}`;}}
                                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=dm.muted;e.currentTarget.style.border=`1px solid ${dm.border}`;e.currentTarget.style.boxShadow='none';}}>
                                <i className={`bi ${btn.icon}`}></i>
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div style={{padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:`1px solid ${dm.border}`,background:dm.card2,flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:11,color:dm.muted}}>
              <span style={{fontWeight:600,color:dm.text}}>{filtered.length===0?0:(currentPage-1)*PAGE_SIZE+1}</span>–<span style={{fontWeight:600,color:dm.text}}>{Math.min(currentPage*PAGE_SIZE,filtered.length)}</span> of <span style={{fontWeight:600,color:dm.text}}>{filtered.length}</span>
            </span>
            <div style={{display:'flex',gap:4}}>
              <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}
                style={{border:`1px solid ${dm.border}`,background:dm.card,borderRadius:7,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:dm.muted,transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,#14b8a6,#6366f1)';e.currentTarget.style.color='#fff';e.currentTarget.style.border='1px solid transparent';}}
                onMouseLeave={e=>{e.currentTarget.style.background=dm.card;e.currentTarget.style.color=dm.muted;e.currentTarget.style.border=`1px solid ${dm.border}`;}}>
                <i className="bi bi-chevron-left" style={{fontSize:11}}></i>
              </button>
              {Array.from({length:Math.min(totalPages,isMobile?3:5)},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setCurrentPage(p)}
                  style={{border:`1px solid ${p===currentPage?'transparent':dm.border}`,background:p===currentPage?'linear-gradient(135deg,#14b8a6,#6366f1)':dm.card,color:p===currentPage?'#fff':dm.muted,borderRadius:7,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontWeight:p===currentPage?700:400,fontSize:12,boxShadow:p===currentPage?'0 4px 12px rgba(20,184,166,0.4)':'none',transition:'all 0.15s'}}>
                  {p}
                </button>
              ))}
              <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}
                style={{border:`1px solid ${dm.border}`,background:dm.card,borderRadius:7,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:dm.muted,transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,#14b8a6,#6366f1)';e.currentTarget.style.color='#fff';e.currentTarget.style.border='1px solid transparent';}}
                onMouseLeave={e=>{e.currentTarget.style.background=dm.card;e.currentTarget.style.color=dm.muted;e.currentTarget.style.border=`1px solid ${dm.border}`;}}>
                <i className="bi bi-chevron-right" style={{fontSize:11}}></i>
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Panel — Hidden on mobile/tablet unless toggled ── */}
        {showMap && !isTablet && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>

            {/* Map */}
            <div style={{...glass,borderRadius:18,overflow:'hidden'}}>
              <div style={{padding:'11px 14px',borderBottom:`1px solid ${dm.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontWeight:700,fontSize:13,color:dm.text,display:'flex',alignItems:'center',gap:6}}>
                  <i className="bi bi-geo-alt" style={{color:'#14b8a6'}}></i>Supplier Map
                </span>
                <span style={{fontSize:10,color:dm.muted}}>Click to add pin</span>
              </div>
              <div style={{height:260}}>
                <CambodiaMap suppliers={suppliers} darkMode={darkMode}/>
              </div>
            </div>

            {/* Selected Detail */}
            {selectedSupplier ? (
              <div style={{...glass,borderRadius:18,overflow:'hidden'}}>
                <div style={{padding:'11px 14px',borderBottom:`1px solid ${dm.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontWeight:700,fontSize:13,color:dm.text,display:'flex',alignItems:'center',gap:6}}>
                    <i className="bi bi-person-lines-fill" style={{color:'#14b8a6'}}></i>Supplier Detail
                  </span>
                  <button onClick={()=>setSelectedSupplier(null)} style={{background:'transparent',border:'none',cursor:'pointer',color:dm.muted,fontSize:20}}>
                    <i className="bi bi-x"></i>
                  </button>
                </div>
                <div style={{padding:'14px 16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:darkMode?'rgba(20,184,166,0.08)':'rgba(20,184,166,0.06)',borderRadius:12,marginBottom:14,border:'1px solid rgba(20,184,166,0.2)'}}>
                    <div style={{width:44,height:44,borderRadius:12,flexShrink:0,background:AVATAR_GRADIENTS[suppliers.indexOf(selectedSupplier)%AVATAR_GRADIENTS.length],display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,color:'#fff',boxShadow:'0 4px 15px rgba(20,184,166,0.3)'}}>
                      {selectedSupplier.name?.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:dm.text}}>{selectedSupplier.name}</div>
                      <div style={{fontSize:10,color:dm.muted,fontFamily:'monospace',marginTop:1}}>SUP-{String(selectedSupplier.id).padStart(3,'0')}</div>
                      <div style={{marginTop:4}}>{statusBadge(selectedSupplier.status)}</div>
                    </div>
                  </div>

                  {[
                    {icon:'bi-person',    label:'Contact',  value:selectedSupplier.contact_name, color:'#6366f1'},
                    {icon:'bi-telephone', label:'Phone',    value:selectedSupplier.phone,         color:'#14b8a6'},
                    {icon:'bi-envelope',  label:'Email',    value:selectedSupplier.email,         color:'#14b8a6'},
                    {icon:'bi-geo-alt',   label:'Address',  value:selectedSupplier.address,       color:'#ef4444'},
                    {icon:'bi-truck',     label:'Delivery', value:selectedSupplier.delivery_company, color:'#f59e0b'},
                    {icon:'bi-tag',       label:'Category', value:selectedSupplier.category,      color:'#6366f1'},
                  ].filter(d=>d.value).map((d,i)=>(
                    <div key={i} style={{display:'flex',gap:9,marginBottom:8,alignItems:'flex-start'}}>
                      <div style={{width:26,height:26,borderRadius:7,background:`${d.color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:`1px solid ${d.color}25`}}>
                        <i className={`bi ${d.icon}`} style={{color:d.color,fontSize:11}}></i>
                      </div>
                      <div>
                        <div style={{fontSize:9,color:dm.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>{d.label}</div>
                        <div style={{fontSize:12,color:dm.text,marginTop:1}}>{d.value}</div>
                      </div>
                    </div>
                  ))}

                  <div style={{display:'flex',gap:8,marginTop:12}}>
                    <button onClick={()=>openEdit(selectedSupplier)}
                      style={{flex:1,padding:'8px',borderRadius:9,border:'none',background:'linear-gradient(135deg,#14b8a6,#6366f1)',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:'inherit',boxShadow:'0 4px 12px rgba(20,184,166,0.3)'}}>
                      <i className="bi bi-pencil"></i>Edit
                    </button>
                    <button onClick={()=>handleDelete(selectedSupplier.id)}
                      style={{flex:1,padding:'8px',borderRadius:9,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',color:'#ef4444',fontWeight:600,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:'inherit'}}>
                      <i className="bi bi-trash"></i>Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{...glass,borderRadius:18,padding:'24px',textAlign:'center',color:dm.muted}}>
                <div style={{width:44,height:44,borderRadius:12,background:'rgba(20,184,166,0.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',border:'1px solid rgba(20,184,166,0.2)'}}>
                  <i className="bi bi-cursor" style={{fontSize:20,color:'#14b8a6'}}></i>
                </div>
                <div style={{fontSize:12,fontWeight:600,color:dm.text}}>Select a Supplier</div>
                <div style={{fontSize:11,marginTop:3,opacity:0.6}}>Click any row to view details</div>
              </div>
            )}
          </div>
        )}

        {/* ── Mobile/Tablet: Supplier Detail Bottom Sheet ── */}
        {isTablet && selectedSupplier && (
          <div style={{...glass,borderRadius:18,overflow:'hidden'}}>
            <div style={{padding:'11px 14px',borderBottom:`1px solid ${dm.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontWeight:700,fontSize:13,color:dm.text,display:'flex',alignItems:'center',gap:6}}>
                <i className="bi bi-person-lines-fill" style={{color:'#14b8a6'}}></i>
                {selectedSupplier.name}
              </span>
              <button onClick={()=>setSelectedSupplier(null)} style={{background:'transparent',border:'none',cursor:'pointer',color:dm.muted,fontSize:20}}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div style={{padding:'14px 16px',display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:10}}>
              {[
                {icon:'bi-person',    label:'Contact',  value:selectedSupplier.contact_name, color:'#6366f1'},
                {icon:'bi-telephone', label:'Phone',    value:selectedSupplier.phone,         color:'#14b8a6'},
                {icon:'bi-envelope',  label:'Email',    value:selectedSupplier.email,         color:'#14b8a6'},
                {icon:'bi-geo-alt',   label:'Address',  value:selectedSupplier.address,       color:'#ef4444'},
                {icon:'bi-truck',     label:'Delivery', value:selectedSupplier.delivery_company, color:'#f59e0b'},
                {icon:'bi-tag',       label:'Category', value:selectedSupplier.category,      color:'#6366f1'},
              ].filter(d=>d.value).map((d,i)=>(
                <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'8px',background:darkMode?'rgba(255,255,255,0.03)':'rgba(248,250,252,0.8)',borderRadius:10,border:`1px solid ${dm.border}`}}>
                  <i className={`bi ${d.icon}`} style={{color:d.color,fontSize:13,marginTop:1,flexShrink:0}}></i>
                  <div>
                    <div style={{fontSize:9,color:dm.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>{d.label}</div>
                    <div style={{fontSize:12,color:dm.text,marginTop:1}}>{d.value}</div>
                  </div>
                </div>
              ))}
              <div style={{display:'flex',gap:8,gridColumn:isMobile?'1':'1/-1'}}>
                <button onClick={()=>openEdit(selectedSupplier)}
                  style={{flex:1,padding:'9px',borderRadius:9,border:'none',background:'linear-gradient(135deg,#14b8a6,#6366f1)',color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:'inherit',boxShadow:'0 4px 12px rgba(20,184,166,0.3)'}}>
                  <i className="bi bi-pencil"></i>Edit
                </button>
                <button onClick={()=>handleDelete(selectedSupplier.id)}
                  style={{flex:1,padding:'9px',borderRadius:9,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',color:'#ef4444',fontWeight:600,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:'inherit'}}>
                  <i className="bi bi-trash"></i>Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',zIndex:999,display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center',padding:isMobile?0:20}}>
          <div style={{...glass,borderRadius:isMobile?'24px 24px 0 0':24,width:'100%',maxWidth:isMobile?'100%':560,maxHeight:isMobile?'90vh':'90vh',overflowY:'auto',boxShadow:'0 30px 80px rgba(0,0,0,0.5)'}}>
            <div style={{padding:'18px 22px',borderBottom:`1px solid ${dm.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:dm.card2,borderRadius:isMobile?'24px 24px 0 0':'24px 24px 0 0'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:34,height:34,borderRadius:9,background:'linear-gradient(135deg,#14b8a6,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <i className={`bi bi-${editSupplier?'pencil':'plus-lg'}`} style={{color:'#fff',fontSize:13}}></i>
                </div>
                <div>
                  <h5 style={{margin:0,fontWeight:700,color:dm.text,fontSize:14}}>{editSupplier?'Edit Supplier':'Add New Supplier'}</h5>
                  <div style={{fontSize:11,color:dm.muted,marginTop:1}}>Fill in the supplier information</div>
                </div>
              </div>
              <button onClick={()=>setShowForm(false)} style={{background:'transparent',border:'none',cursor:'pointer',color:dm.muted,fontSize:22,lineHeight:1}}>
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div style={{padding:'18px 22px'}}>
              <div className="row g-3">
                <div className="col-12">
                  <label style={{fontSize:10,fontWeight:700,color:dm.muted,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>Company Name *</label>
                  <input style={inp} placeholder="e.g. Global Foods Co."
                    value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
                </div>
                {[
                  {label:'Contact Person',key:'contact_name',placeholder:'e.g. Sophea Ros',col:6},
                  {label:'Phone',         key:'phone',        placeholder:'+855 12 345 678',col:6},
                  {label:'Email',         key:'email',        placeholder:'email@company.com',col:6,type:'email'},
                  {label:'Category',      key:'category',     placeholder:'e.g. food, iPhone...',col:6},
                  {label:'🚚 Delivery Co.',key:'delivery_company',placeholder:'e.g. DHL, J&T...',col:6},
                  {label:'Rating (1–5)',  key:'rating',       placeholder:'5.0',col:6,type:'number'},
                ].map(f=>(
                  <div className={`col-${isMobile?12:f.col}`} key={f.key}>
                    <label style={{fontSize:10,fontWeight:700,color:dm.muted,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>{f.label}</label>
                    <input style={inp} type={f.type||'text'} placeholder={f.placeholder}
                      value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>
                  </div>
                ))}
                <div className={`col-${isMobile?12:6}`}>
                  <label style={{fontSize:10,fontWeight:700,color:dm.muted,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>Status</label>
                  <select style={inp} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                    <option value="active">✅ Active</option>
                    <option value="inactive">⚫ Inactive</option>
                    <option value="pending">⏳ Pending</option>
                  </select>
                </div>
                <div className="col-12">
                  <label style={{fontSize:10,fontWeight:700,color:dm.muted,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.08em'}}>📍 Address / Location</label>
                  <input style={inp} placeholder="e.g. Phnom Penh, Cambodia"
                    value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
                  <div style={{fontSize:10,color:'#14b8a6',marginTop:4,display:'flex',alignItems:'center',gap:4}}>
                    <i className="bi bi-info-circle"></i>Include city name to show pin on map
                  </div>
                </div>
              </div>
            </div>

            <div style={{padding:'14px 22px 20px',display:'flex',gap:8,borderTop:`1px solid ${dm.border}`}}>
              <button onClick={handleSave}
                style={{flex:1,padding:'12px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#14b8a6,#6366f1)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:6,boxShadow:'0 4px 15px rgba(20,184,166,0.4)',fontFamily:'inherit'}}>
                <i className="bi bi-check-lg"></i>{editSupplier?'Update':'Save Supplier'}
              </button>
              <button onClick={()=>setShowForm(false)}
                style={{flex:1,padding:'12px',borderRadius:12,border:`1px solid ${dm.border}`,background:'transparent',color:dm.text,fontWeight:600,cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.4)}}`}</style>
    </div>
  );
}