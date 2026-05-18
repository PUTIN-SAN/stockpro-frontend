import React from 'react';

const navItems = [
  { label: 'Dashboard',  icon: 'bi-grid-1x2',      page: 'dashboard', roles: ['admin','staff'] },
  { label: 'Inventory',  icon: 'bi-boxes',          page: 'inventory', roles: ['admin','staff'] },
  { label: 'Suppliers',  icon: 'bi-truck',          page: 'suppliers', roles: ['admin','staff'] },
  { label: 'Purchases',  icon: 'bi-receipt-cutoff', page: 'purchases', roles: ['admin','staff'] },
  { label: 'Reports',    icon: 'bi-bar-chart-line', page: 'reports',   roles: ['admin'] },
  { label: 'Users',      icon: 'bi-people',         page: 'users',     roles: ['admin'] },
];

export default function Sidebar({ currentPage, onNavigate, onLogout, user, darkMode, avatar, isMobile, isOpen, onClose }) {

  const sidebarStyle = isMobile ? {
    // ── Mobile: drawer slide in/out ──
    position: 'fixed', left: 0, top: 0, zIndex: 300,
    width: 260, height: '100vh',
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowY: 'auto',
  } : {
    // ── Desktop: always visible ──
    position: 'fixed', left: 0, top: 0, zIndex: 100,
    width: 220, height: '100vh',
    transform: 'translateX(0)',
    overflowY: 'auto',
  };

  const bgWidth = isMobile ? 260 : 220;

  return (
    <>
      {/* Gradient background layer */}
      <div style={{
        position: 'fixed', left: 0, top: 0,
        width: bgWidth, height: '100vh',
        background: darkMode
          ? 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
          : 'linear-gradient(160deg, #1a3a5c 0%, #1e6bde 50%, #0d1f3d 100%)',
        zIndex: isMobile ? 299 : 99,
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}/>

      {/* Glassmorphism Sidebar */}
      <div style={{
        ...sidebarStyle,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
        borderRight: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
      }}>

        {/* ── Logo + Close Button (mobile) ── */}
        <div style={{
          padding: '22px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #00c9a7, #1e6bde)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,201,167,0.4)',
              flexShrink: 0,
            }}>
              <i className="bi bi-boxes" style={{ color:'#fff', fontSize:18 }}></i>
            </div>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:'1.1rem', letterSpacing:'-0.3px' }}>StockPro</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.68rem' }}>Management System</div>
            </div>
          </div>

          {/* Close button — mobile only */}
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '1rem',
                transition: 'all 0.2s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              aria-label="Close sidebar"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        {/* Menu Label */}
        <div style={{ padding:'16px 20px 6px', color:'rgba(255,255,255,0.3)', fontSize:'0.65rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase' }}>
          Main Menu
        </div>

        {/* Nav Links */}
        <nav style={{ flex:1, padding:'6px 10px' }}>
          {navItems
            .filter(item => item.roles.includes(user?.role))
            .map(item => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    if (isMobile) onClose();
                  }}
                  style={{
                    width:'100%', display:'flex', alignItems:'center',
                    gap:12, padding:'10px 14px', borderRadius:12,
                    border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                    cursor:'pointer', marginBottom:4,
                    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                    backdropFilter: isActive ? 'blur(10px)' : 'none',
                    WebkitBackdropFilter: isActive ? 'blur(10px)' : 'none',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize:'0.9rem', transition:'all 0.2s',
                    boxShadow: isActive ? '0 4px 15px rgba(0,0,0,0.2)' : 'none',
                    textAlign:'left', fontFamily:'inherit',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                    boxShadow: isActive ? '0 2px 10px rgba(0,201,167,0.3)' : 'none',
                    transition: 'all 0.2s', flexShrink: 0,
                  }}>
                    <i className={`bi ${item.icon}`} style={{ fontSize:'1rem' }}></i>
                  </div>
                  <span>{item.label}</span>
                  {isActive && (
                    <div style={{
                      marginLeft:'auto', width:6, height:6, borderRadius:'50%',
                      background: 'linear-gradient(135deg, #00c9a7, #1e6bde)',
                      boxShadow: '0 0 8px rgba(0,201,167,0.8)',
                    }}/>
                  )}
                </button>
              );
            })
          }
        </nav>

        {/* Divider */}
        <div style={{ margin:'0 14px', height:1, background:'rgba(255,255,255,0.08)' }}/>

        {/* User Card */}
        <div style={{ padding:'14px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)',
            padding: '10px 12px', marginBottom: 10,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: avatar ? 'none' : (user?.role === 'admin'
                  ? 'linear-gradient(135deg, #00c9a7, #0d9488)'
                  : 'linear-gradient(135deg, #f59f00, #d97706)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.95rem', color: '#fff',
                boxShadow: user?.role === 'admin'
                  ? '0 4px 12px rgba(0,201,167,0.4)'
                  : '0 4px 12px rgba(245,159,0,0.4)',
                flexShrink: 0, overflow: 'hidden',
                border: avatar ? '2px solid rgba(0,201,167,0.5)' : 'none',
              }}>
                {avatar
                  ? <img src={avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : user?.name?.charAt(0).toUpperCase() || 'U'
                }
              </div>

              <div style={{ overflow:'hidden', flex:1 }}>
                <div style={{ color:'#fff', fontSize:'0.85rem', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize:'0.7rem', color: user?.role==='admin' ? '#00c9a7' : '#f59f00', fontWeight:600, textTransform:'capitalize' }}>
                  {user?.role==='admin' ? '👑 Administrator' : '👤 Staff'}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Button */}
          <button
            onClick={() => { onNavigate('profile'); if (isMobile) onClose(); }}
            style={{
              width:'100%', padding:'9px',
              background: currentPage === 'profile' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              border: currentPage === 'profile' ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: currentPage === 'profile' ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 7, transition: 'all 0.2s', fontFamily: 'inherit', marginBottom: 8,
            }}
            onMouseEnter={e => { if (currentPage !== 'profile') { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}}
            onMouseLeave={e => { if (currentPage !== 'profile') { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}}
          >
            <i className="bi bi-person-circle"></i> Profile Settings
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            style={{
              width:'100%', padding:'9px',
              background: 'rgba(231,76,60,0.12)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(231,76,60,0.25)', borderRadius: 10, color: '#fc8181',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 7, transition: 'all 0.2s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.25)'; e.currentTarget.style.borderColor = 'rgba(231,76,60,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.12)'; e.currentTarget.style.borderColor = 'rgba(231,76,60,0.25)'; }}
          >
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </div>
    </>
  );
}