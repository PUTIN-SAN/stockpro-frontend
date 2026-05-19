import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ onLogout, children, currentPage, onNavigate, user, avatar, darkMode, onToggleDark }) {
  const [alerts, setAlerts]         = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // ── Detect mobile ──
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Lock scroll when sidebar open on mobile ──
  useEffect(() => {
    document.body.style.overflow = (isMobile && sidebarOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen]);

  const fetchAlerts = () => {
    fetch('https://stockpro-backend-production-8344.up.railway.app/api/products', { headers })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAlerts(data.filter(p => p.quantity <= p.min_quantity)); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const pageLabels = {
    dashboard: 'Dashboard', inventory: 'Inventory',
    suppliers: 'Suppliers', purchases: 'Purchases',
    reports: 'Reports', users: 'Users', profile: 'Profile Settings',
  };

  const bottomNavItems = [
    { key: 'dashboard', icon: 'bi-house',       label: 'Dashboard' },
    { key: 'inventory', icon: 'bi-box-seam',    label: 'Inventory' },
    { key: 'purchases', icon: 'bi-cart3',       label: 'Purchases' },
    { key: 'reports',   icon: 'bi-bar-chart',   label: 'Reports'   },
    { key: 'suppliers', icon: 'bi-building',    label: 'Suppliers' },
  ];

  const UserAvatar = ({ size = 30, fontSize = '0.82rem' }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatar ? 'none' : (user?.role === 'admin'
        ? 'linear-gradient(135deg, #00c9a7, #0d9488)'
        : 'linear-gradient(135deg, #f59f00, #d97706)'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize, color: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {avatar
        ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : user?.name?.charAt(0).toUpperCase() || 'U'
      }
    </div>
  );

  return (
<div style={{
  display: 'flex',
  minHeight: '100vh',
  background: darkMode ? '#0a0f1e' : '#f0f4fb',
  transition: 'background 0.3s',
  overflow: 'hidden',      // ✅ បន្ថែម
  position: 'relative',    // ✅ បន្ថែម
  width: '100%',           // ✅ បន្ថែម
}}>

      {/* ── Mobile Overlay ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 200,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <Sidebar
        currentPage={currentPage} onNavigate={(page) => { onNavigate(page); if (isMobile) setSidebarOpen(false); }}
        onLogout={onLogout} user={user} darkMode={darkMode}
        avatar={avatar} isMobile={isMobile} isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main Area ── */}
      <div style={{
  marginLeft: isMobile ? 0 : 220,
  width: isMobile ? '100%' : 'calc(100% - 220px)',  // ✅ បន្ថែម
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  maxWidth: '100%',          // ✅ បន្ថែម
  overflowX: 'hidden',       // ✅ បន្ថែម
  transition: 'margin-left 0.3s ease',
  paddingBottom: isMobile ? 64 : 0,
}}>

        {/* ── Mobile Topbar (hamburger) ── */}
        {isMobile ? (
          <div style={{
            height: 60,
            position: 'sticky', top: 0, zIndex: 100,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            background: darkMode ? 'rgba(10,15,30,0.95)' : 'rgba(255,255,255,0.92)',
            borderBottom: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          }}>

            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
                background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 5, padding: 8, transition: 'all 0.2s',
              }}
              aria-label="Toggle menu"
              aria-expanded={sidebarOpen}
            >
              <span style={{
                display: 'block', width: 18, height: 2,
                background: darkMode ? '#f1f5f9' : '#334155',
                borderRadius: 2, transition: 'all 0.3s ease',
                transform: sidebarOpen ? 'translateY(7px) rotate(45deg)' : 'none',
              }}/>
              <span style={{
                display: 'block', width: 18, height: 2,
                background: darkMode ? '#f1f5f9' : '#334155',
                borderRadius: 2, transition: 'all 0.3s ease',
                opacity: sidebarOpen ? 0 : 1,
                transform: sidebarOpen ? 'scaleX(0)' : 'none',
              }}/>
              <span style={{
                display: 'block', width: 18, height: 2,
                background: darkMode ? '#f1f5f9' : '#334155',
                borderRadius: 2, transition: 'all 0.3s ease',
                transform: sidebarOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
              }}/>
            </button>

            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'linear-gradient(135deg, #00c9a7, #1e6bde)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-boxes" style={{ color:'#fff', fontSize: 14 }}></i>
              </div>
              <span style={{
                fontSize: '1rem', fontWeight: 700,
                color: darkMode ? '#f1f5f9' : '#0f1f3d',
              }}>StockPro</span>
            </div>

            {/* Right: bell + avatar */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => setShowAlerts(!showAlerts)} style={{
                width: 36, height: 36, borderRadius: 10, cursor:'pointer',
                background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1rem', color: darkMode ? 'rgba(255,255,255,0.7)' : '#64748b',
                position: 'relative',
              }}>
                <i className="bi bi-bell"></i>
                {alerts.length > 0 && (
                  <span style={{
                    position:'absolute', top:8, right:8,
                    width:7, height:7, borderRadius:'50%',
                    background:'#e74c4c', boxShadow:'0 0 6px rgba(231,76,60,0.8)',
                    animation:'pulse 1.5s infinite',
                  }}/>
                )}
              </button>
              <div onClick={() => { onNavigate('profile'); if (isMobile) setSidebarOpen(false); }} style={{ cursor:'pointer' }}>
                <UserAvatar size={34} fontSize="0.85rem" />
              </div>
            </div>
          </div>

        ) : (
          /* ── Desktop Topbar ── */
          <div style={{
            height: 64,
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            background: darkMode ? 'rgba(10,15,30,0.8)' : 'rgba(255,255,255,0.7)',
            borderBottom: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky', top: 0, zIndex: 50,
            boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            {/* Breadcrumb */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(30,107,222,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-grid-1x2" style={{ color:'#1e6bde', fontSize:14 }}></i>
              </div>
              <div style={{ fontSize:'0.75rem', color: darkMode?'rgba(255,255,255,0.4)':'#94a3b8' }}>StockPro</div>
              <i className="bi bi-chevron-right" style={{ fontSize:'0.65rem', color: darkMode?'rgba(255,255,255,0.2)':'#cbd5e1' }}></i>
              <div style={{ fontSize:'0.88rem', fontWeight:600, color: darkMode?'#f1f5f9':'#0f1f3d' }}>
                {pageLabels[currentPage] || currentPage}
              </div>
            </div>

            {/* Right Controls */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {/* Dark Mode Toggle */}
              <button onClick={onToggleDark} style={{
                width: 40, height: 40, borderRadius: 10, cursor:'pointer',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1rem', color: darkMode?'#f59f00':'#64748b', transition:'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = darkMode?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.05)'; }}
                title={darkMode?'Light Mode':'Dark Mode'}>
                <i className={`bi bi-${darkMode?'sun':'moon'}`}></i>
              </button>

              {/* Bell */}
              <div style={{ position:'relative' }}>
                <button onClick={() => setShowAlerts(!showAlerts)} style={{
                  width: 40, height: 40, borderRadius: 10, cursor:'pointer',
                  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1rem', color: darkMode?'rgba(255,255,255,0.7)':'#64748b',
                  transition:'all 0.2s', position:'relative',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = darkMode?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.05)'; }}>
                  <i className="bi bi-bell"></i>
                  {alerts.length > 0 && (
                    <span style={{
                      position:'absolute', top:8, right:8,
                      width:8, height:8, borderRadius:'50%',
                      background:'#e74c4c', boxShadow:'0 0 6px rgba(231,76,60,0.8)',
                      animation:'pulse 1.5s infinite',
                    }}/>
                  )}
                </button>

                {/* Alert Dropdown */}
                {showAlerts && (
                  <div style={{
                    position:'absolute', right:0, top:50, width:320,
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    background: darkMode ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)',
                    borderRadius: 16,
                    border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    zIndex: 200, overflow:'hidden',
                  }}>
                    <div style={{
                      padding:'14px 18px',
                      borderBottom: darkMode?'1px solid rgba(255,255,255,0.08)':'1px solid rgba(0,0,0,0.06)',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                    }}>
                      <span style={{ fontWeight:700, fontSize:'0.9rem', color: darkMode?'#f1f5f9':'#0f1f3d', display:'flex', alignItems:'center', gap:6 }}>
                        <i className="bi bi-bell" style={{ color:'#1e6bde' }}></i>
                        Low Stock Alerts
                      </span>
                      <span style={{ background:'#e74c4c', color:'#fff', borderRadius:20, padding:'1px 8px', fontSize:10, fontWeight:700 }}>
                        {alerts.length}
                      </span>
                    </div>
                    <div style={{ maxHeight:280, overflowY:'auto' }}>
                      {alerts.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'24px', color: darkMode?'#64748b':'#94a3b8' }}>
                          <i className="bi bi-check-circle" style={{ fontSize:28, display:'block', marginBottom:6, color:'#00c9a7' }}></i>
                          All stock levels OK!
                        </div>
                      ) : alerts.map(p => (
                        <div key={p.id} style={{
                          padding:'12px 18px',
                          borderBottom: darkMode?'1px solid rgba(255,255,255,0.05)':'1px solid rgba(0,0,0,0.04)',
                          display:'flex', alignItems:'center', gap:12,
                        }}>
                          <div style={{
                            width:38, height:38, borderRadius:10,
                            background:'rgba(245,159,0,0.15)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color:'#f59f00', fontSize:'1rem', flexShrink:0,
                          }}>
                            <i className="bi bi-exclamation-triangle"></i>
                          </div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:'0.85rem', color: darkMode?'#f1f5f9':'#0f1f3d' }}>{p.name}</div>
                            <div style={{ fontSize:'0.75rem', color:'#e74c4c', marginTop:1 }}>
                              Only {p.quantity} left — Min: {p.min_quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:'10px 18px', borderTop: darkMode?'1px solid rgba(255,255,255,0.08)':'1px solid rgba(0,0,0,0.06)' }}>
                      <button
                        onClick={() => { onNavigate('inventory'); setShowAlerts(false); }}
                        style={{
                          width:'100%', padding:'8px',
                          background: 'linear-gradient(135deg, #1e6bde, #00c9a7)',
                          border:'none', borderRadius:8, color:'#fff',
                          fontWeight:600, fontSize:'0.82rem', cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                        }}>
                        <i className="bi bi-boxes"></i>View Inventory
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div onClick={() => onNavigate('profile')} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'6px 10px 6px 6px',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: 10, cursor:'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = darkMode?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = darkMode?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.04)'; }}
              >
                <UserAvatar size={30} fontSize="0.82rem" />
                <div>
                  <div style={{ fontSize:'0.82rem', fontWeight:600, color: darkMode?'#f1f5f9':'#0f1f3d', lineHeight:1 }}>{user?.name}</div>
                  <div style={{ fontSize:'0.68rem', color: user?.role==='admin'?'#00c9a7':'#f59f00', marginTop:1 }}>{user?.role}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Page Content ── */}
        <div style={{
  padding: isMobile ? '14px 12px' : '28px 32px',
  flex: 1,
  color: darkMode ? '#f1f5f9' : '#0f1f3d',
  overflowX: 'hidden',
  width: '100%',
  boxSizing: 'border-box',
}}>

          {children}
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 64,
          zIndex: 9999,  
          display: 'flex', alignItems: 'stretch',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          background: darkMode ? 'rgba(10,15,30,0.95)' : 'rgba(255,255,255,0.95)',
          borderTop: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {bottomNavItems.map(item => {
            const active = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 3,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: active
                    ? '#00c9a7'
                    : darkMode ? 'rgba(255,255,255,0.4)' : '#94a3b8',
                  fontSize: '0.6rem', fontWeight: 600,
                  letterSpacing: '0.3px',
                  position: 'relative',
                  transition: 'color 0.2s',
                  paddingBottom: 4,
                }}
              >
                {/* Active indicator bar */}
                {active && (
                  <span style={{
                    position: 'absolute', top: 0,
                    left: '50%', transform: 'translateX(-50%)',
                    width: 28, height: 3,
                    background: 'linear-gradient(90deg, #00c9a7, #1e6bde)',
                    borderRadius: '0 0 4px 4px',
                  }}/>
                )}
                <i className={`bi ${item.icon}`} style={{ fontSize: active ? '1.25rem' : '1.1rem', transition:'font-size 0.2s' }}></i>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.6; transform:scale(1.3); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>
    </div>
  );
}