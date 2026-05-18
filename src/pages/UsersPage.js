import React, { useState, useEffect } from 'react';

const BASE_URL = 'http://localhost:5000';

// ✅ Load avatar តាម user ID ពី localStorage
function getUserAvatar(userId) {
  return localStorage.getItem(`userAvatar_${userId}`) || null;
}

// ✅ Avatar component
function UserAvatarCell({ user, size = 38 }) {
  const avatar  = getUserAvatar(user.id);
  const isAdmin = user.role === 'admin';
  const grad    = isAdmin ? 'linear-gradient(135deg,#10b981,#14b8a6)' : 'linear-gradient(135deg,#f59e0b,#f97316)';
  const glow    = isAdmin ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatar ? 'none' : grad,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.4, color: '#fff', flexShrink: 0,
      overflow: 'hidden', boxShadow: `0 4px 12px ${glow}`,
      border: avatar ? `2px solid ${isAdmin ? '#10b981' : '#f59e0b'}` : 'none',
    }}>
      {avatar
        ? <img src={avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : user.name?.charAt(0).toUpperCase()
      }
    </div>
  );
}

export default function UsersPage({ darkMode }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'staff' });
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [tick, setTick]         = useState(0); // force re-render after avatar change

  const token   = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

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
    color: dm.text, borderRadius: 10, padding: '9px 13px',
    width: '100%', outline: 'none', fontSize: '13px', fontFamily: 'inherit',
    transition: 'all 0.2s', boxSizing: 'border-box',
  };

  const fetchUsers = () => {
    setLoading(true);
    fetch(`${BASE_URL}/api/auth/users`, { headers })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAddForm  = () => { setEditUser(null); setForm({ name: '', email: '', password: '', role: 'staff' }); setError(''); setShowForm(true); };
  const openEditForm = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setError(''); setShowForm(true); };

  const handleSave = () => {
    if (!form.name || !form.email) { setError('Name and Email are required!'); return; }
    if (!editUser && !form.password) { setError('Password is required!'); return; }
    const method = editUser ? 'PUT' : 'POST';
    const url    = editUser ? `${BASE_URL}/api/auth/users/${editUser.id}` : `${BASE_URL}/api/auth/users`;
    fetch(url, { method, headers, body: JSON.stringify(form) })
      .then(r => r.json())
      .then(data => {
        if (data.message === 'ok' || data.id) { fetchUsers(); setShowForm(false); }
        else setError(data.message || 'Error saving user');
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this user?')) return;
    fetch(`${BASE_URL}/api/auth/users/${id}`, { method: 'DELETE', headers })
      .then(() => { localStorage.removeItem(`userAvatar_${id}`); fetchUsers(); });
  };

  // ✅ Upload avatar តាម user ID
  const handleAvatarUpload = (e, userId) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      localStorage.setItem(`userAvatar_${userId}`, ev.target.result);
      setTick(t => t + 1); // re-render
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = (userId) => {
    localStorage.removeItem(`userAvatar_${userId}`);
    setTick(t => t + 1);
  };

  const totalUsers  = users.length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalStaff  = users.filter(u => u.role === 'staff').length;
  const filtered    = users.filter(u => {
    const matchRole   = filterRole === 'all' || u.role === filterRole;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div style={{ background: dm.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h4 style={{ fontWeight: 800, margin: 0, color: dm.text, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>User Management</h4>
          <div style={{ fontSize: 12, color: dm.muted, marginTop: 2 }}>
            Dashboard <i className="bi bi-chevron-right" style={{ fontSize: 9, margin: '0 4px' }}></i>
            <span style={{ color: dm.text }}>Users</span>
          </div>
        </div>
        <button onClick={openAddForm} style={{ background: 'linear-gradient(135deg,#14b8a6,#6366f1)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 15px rgba(20,184,166,0.4)', fontFamily: 'inherit' }}>
          <i className="bi bi-person-plus"></i>Add New User
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Users', value: totalUsers,  icon: 'bi-people',       grad: 'linear-gradient(135deg,#14b8a6,#6366f1)', glow: 'rgba(20,184,166,0.3)' },
          { label: 'Admins',      value: totalAdmins, icon: 'bi-shield-check', grad: 'linear-gradient(135deg,#10b981,#14b8a6)', glow: 'rgba(16,185,129,0.3)' },
          { label: 'Staff',       value: totalStaff,  icon: 'bi-person-badge', grad: 'linear-gradient(135deg,#f59e0b,#f97316)', glow: 'rgba(245,158,11,0.3)' },
        ].map((c, i) => (
          <div key={i} style={{ ...glass, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${c.glow}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(15,23,42,0.08)'; }}>
            <div>
              <div style={{ fontSize: 10, color: dm.muted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: dm.text, lineHeight: 1 }}>{c.value}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', boxShadow: `0 4px 15px ${c.glow}` }}>
              <i className={`bi ${c.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Table Panel */}
      <div style={{ ...glass, borderRadius: 20, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${dm.border}`, background: dm.card2 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: dm.text, display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="bi bi-people" style={{ color: '#14b8a6' }}></i>User List
          </span>
          <div style={{ flex: 1 }}></div>
          <div style={{ position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: dm.muted, fontSize: 13, pointerEvents: 'none' }}></i>
            <input style={{ ...inp, paddingLeft: 32, width: 230 }} placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 3, padding: '8px 18px', background: dm.card2, borderBottom: `1px solid ${dm.border}` }}>
          {['all','admin','staff'].map(tab => {
            const grads = { all: 'linear-gradient(135deg,#14b8a6,#6366f1)', admin: 'linear-gradient(135deg,#10b981,#14b8a6)', staff: 'linear-gradient(135deg,#f59e0b,#f97316)' };
            const count = tab === 'all' ? users.length : users.filter(u => u.role === tab).length;
            return (
              <button key={tab} onClick={() => setFilterRole(tab)}
                style={{ padding: '5px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all 0.15s', background: filterRole === tab ? grads[tab] : 'transparent', color: filterRole === tab ? '#fff' : dm.muted }}>
                {tab === 'admin' ? '👑 ' : tab === 'staff' ? '👤 ' : ''}{tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span style={{ marginLeft: 5, background: filterRole === tab ? 'rgba(255,255,255,0.25)' : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'), color: filterRole === tab ? '#fff' : dm.muted, padding: '1px 7px', borderRadius: 10, fontSize: 10 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: dm.muted }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(20,184,166,0.2)', borderTop: '3px solid #14b8a6', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Loading users...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: dm.card2 }}>
                  {['#','USER','EMAIL','ROLE','CREATED','ACTIONS'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, color: dm.muted, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${dm.border}`, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60, color: dm.muted }}>
                    <i className="bi bi-people" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.3 }}></i>
                    No users found
                  </td></tr>
                ) : filtered.map((u, i) => (
                  <tr key={`${u.id}-${tick}`}
                    style={{ borderBottom: `1px solid ${dm.border}`, transition: 'all 0.15s', borderLeft: '3px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = dm.hover; e.currentTarget.style.borderLeft = '3px solid #14b8a6'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = '3px solid transparent'; }}>
                    <td style={{ padding: '13px 14px', fontSize: 12, color: dm.muted }}>{i + 1}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <UserAvatarCell user={u} size={38} />
                        <span style={{ fontWeight: 700, fontSize: 13, color: dm.text }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 12, color: dm.muted }}>{u.email}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: u.role === 'admin' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: u.role === 'admin' ? '#10b981' : '#f59e0b', border: `1px solid ${u.role === 'admin' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: u.role === 'admin' ? '#10b981' : '#f59e0b' }} />
                        {u.role === 'admin' ? '👑 Admin' : '👤 Staff'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 12, color: dm.muted }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {[
                          { icon: 'bi-pencil', onClick: () => openEditForm(u), hover: 'linear-gradient(135deg,#14b8a6,#6366f1)', glow: 'rgba(20,184,166,0.4)' },
                          { icon: 'bi-trash',  onClick: () => handleDelete(u.id), hover: 'linear-gradient(135deg,#ef4444,#f97316)', glow: 'rgba(239,68,68,0.4)' },
                        ].map((btn, bi) => (
                          <button key={bi} onClick={btn.onClick}
                            style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${dm.border}`, background: 'transparent', color: dm.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = btn.hover; e.currentTarget.style.color = '#fff'; e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.boxShadow = `0 4px 12px ${btn.glow}`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dm.muted; e.currentTarget.style.border = `1px solid ${dm.border}`; e.currentTarget.style.boxShadow = 'none'; }}>
                            <i className={`bi ${btn.icon}`}></i>
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ ...glass, borderRadius: 24, width: '100%', maxWidth: 480, boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${dm.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dm.card2, borderRadius: '24px 24px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#14b8a6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`bi bi-${editUser ? 'pencil' : 'person-plus'}`} style={{ color: '#fff', fontSize: 18 }}></i>
                </div>
                <div>
                  <h5 style={{ margin: 0, fontWeight: 800, color: dm.text, fontSize: 15 }}>{editUser ? 'Edit User' : 'New User'}</h5>
                  <div style={{ fontSize: 11, color: dm.muted, marginTop: 1 }}>{editUser ? 'Update account information' : 'Fill in user details below'}</div>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: dm.muted, fontSize: 22 }}>
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div style={{ padding: '22px 24px' }}>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-exclamation-triangle"></i>{error}
                </div>
              )}

              {/* ✅ Avatar Upload — Edit mode only */}
              {editUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 14, background: darkMode ? 'rgba(20,184,166,0.05)' : 'rgba(20,184,166,0.04)', borderRadius: 12, border: '1px solid rgba(20,184,166,0.15)' }}>
                  <UserAvatarCell user={editUser} size={52} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: dm.text, marginBottom: 6 }}>Profile Photo</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <label htmlFor={`av_${editUser.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', background: 'linear-gradient(135deg,#14b8a6,#6366f1)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                        <i className="bi bi-upload"></i> Upload
                      </label>
                      <input id={`av_${editUser.id}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleAvatarUpload(e, editUser.id)} />
                      {getUserAvatar(editUser.id) && (
                        <button onClick={() => removeAvatar(editUser.id)}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          <i className="bi bi-trash"></i> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Fields */}
              {[
                { label: 'Full Name *', icon: 'bi-person', color: '#14b8a6', field: 'name', type: 'text', placeholder: 'e.g. John Doe' },
                { label: 'Email *',     icon: 'bi-envelope', color: '#6366f1', field: 'email', type: 'email', placeholder: 'e.g. john@stock.com' },
                { label: editUser ? 'Password (leave blank = no change)' : 'Password *', icon: 'bi-lock', color: '#f59e0b', field: 'password', type: 'password', placeholder: '••••••••' },
              ].map(({ label, icon, color, field, type, placeholder }) => (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: dm.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    <i className={`bi ${icon}`} style={{ marginRight: 5, color }}></i>{label}
                  </label>
                  <input style={inp} type={type} placeholder={placeholder} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
                </div>
              ))}

              {/* Role */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: dm.muted, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  <i className="bi bi-shield" style={{ marginRight: 5, color: '#10b981' }}></i>Role
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { value: 'admin', label: '👑 Admin', grad: 'linear-gradient(135deg,#10b981,#14b8a6)', glow: 'rgba(16,185,129,0.3)' },
                    { value: 'staff', label: '👤 Staff', grad: 'linear-gradient(135deg,#f59e0b,#f97316)', glow: 'rgba(245,158,11,0.3)' },
                  ].map(r => (
                    <button key={r.value} onClick={() => setForm({ ...form, role: r.value })}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, transition: 'all 0.2s', background: form.role === r.value ? r.grad : 'transparent', color: form.role === r.value ? '#fff' : dm.muted, border: `2px solid ${form.role === r.value ? 'transparent' : dm.border}`, boxShadow: form.role === r.value ? `0 4px 15px ${r.glow}` : 'none' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px 20px', display: 'flex', gap: 8, borderTop: `1px solid ${dm.border}` }}>
              <button onClick={handleSave} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#14b8a6,#6366f1)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 15px rgba(20,184,166,0.4)', fontFamily: 'inherit' }}>
                <i className={`bi bi-${editUser ? 'check-lg' : 'person-plus'}`}></i>
                {editUser ? 'Update User' : 'Create User'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${dm.border}`, background: 'transparent', color: dm.text, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}