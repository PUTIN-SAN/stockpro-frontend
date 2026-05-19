import React, { useState, useRef } from 'react';

const API = 'https://stockpro-backend-production-8344.up.railway.app/api/auth';
function getToken() { return localStorage.getItem('token') || ''; }

// ── Toast ──────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  React.useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      background: type === 'error' ? '#fee2e2' : '#d1fae5',
      color: type === 'error' ? '#dc2626' : '#059669',
      border: `1px solid ${type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
      borderRadius: 12, padding: '12px 20px',
      fontWeight: 600, fontSize: 13,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <i className={`bi ${type === 'error' ? 'bi-x-circle' : 'bi-check-circle'}`}></i>
      {msg}
    </div>
  );
}

export default function ProfileSettings({ darkMode, user, setUser, onAvatarChange }) {
  const [tab, setTab]       = useState('profile'); // profile | password | avatar
  const [form, setForm]     = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwd, setPwd]       = useState({ current: '', new: '', confirm: '' });
  const [avatar, setAvatar] = useState(() => localStorage.getItem(`userAvatar_${user?.id}`) || null);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [toast, setToast]   = useState({ msg: '', type: '' });
  const fileRef = useRef();

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // Colors
  const bg      = darkMode ? '#0f172a' : '#f8fafc';
  const cardBg  = darkMode ? '#1e293b' : '#ffffff';
  const border  = darkMode ? '#334155' : '#e2e8f0';
  const text    = darkMode ? '#f1f5f9' : '#0f172a';
  const muted   = darkMode ? '#94a3b8' : '#64748b';
  const inputBg = darkMode ? '#0f172a' : '#f8fafc';
  const inputBorder = darkMode ? '#334155' : '#e2e8f0';

  // ── Avatar upload ──
  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target.result);
      localStorage.setItem(`userAvatar_${user?.id}`, ev.target.result);
      if (onAvatarChange) onAvatarChange(ev.target.result);
      showToast('Avatar updated!');
    };
    reader.readAsDataURL(file);
  };

  // ── Save profile ──
  const handleSave = async () => {
    if (!form.name || !form.email) return showToast('Name and email required', 'error');
    setSaving(true);
    const updated = { ...user, name: form.name, email: form.email };
    localStorage.setItem('user', JSON.stringify(updated));
    if (setUser) setUser(updated);
    try {
      const res = await fetch(`${API}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });
      if (res.status === 401) { showToast('Saved! Please re-login to sync server.'); return; }
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      showToast('Profile saved successfully!');
    } catch { showToast('Saved locally!'); }
    finally { setSaving(false); }
  };

  // ── Change password ──
  const handleChangePwd = async () => {
    if (!pwd.current || !pwd.new || !pwd.confirm) return showToast('Fill all fields', 'error');
    if (pwd.new !== pwd.confirm) return showToast("Passwords don't match", 'error');
    if (pwd.new.length < 6) return showToast('Min 6 characters', 'error');
    setChangingPwd(true);
    try {
      const res = await fetch(`${API}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ current_password: pwd.current, new_password: pwd.new }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPwd({ current: '', new: '', confirm: '' });
      showToast('Password changed!');
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setChangingPwd(false); }
  };

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'May 10, 2026';

  const strength = pwd.new.length >= 10 && /[A-Z]/.test(pwd.new) && /[0-9]/.test(pwd.new) ? 4
    : pwd.new.length >= 8 && /[A-Z]/.test(pwd.new) ? 3
    : pwd.new.length >= 6 ? 2 : pwd.new.length > 0 ? 1 : 0;
  const strengthColor = ['','#ef4444','#f97316','#eab308','#22c55e'][strength];
  const strengthLabel = ['','Weak','Fair','Good','Strong'][strength];

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px 11px 40px',
    background: inputBg, border: `1px solid ${inputBorder}`,
    borderRadius: 10, color: text, fontSize: 14,
    fontFamily: 'inherit', outline: 'none', transition: 'border 0.2s',
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700,
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: muted, marginBottom: 6,
  };

  const tabs = [
    { key: 'profile',  icon: 'bi-person',      label: 'Edit Profile',    roles: ['admin','staff'] },
    { key: 'password', icon: 'bi-shield-lock', label: 'Change Password', roles: ['admin','staff'] },
    { key: 'avatar',   icon: 'bi-image',       label: 'Choose Avatar',   roles: ['admin'] },
  ].filter(t => t.roles.includes(user?.role));

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 60px' }}>

      {/* ── Profile Card (Header) ── */}
      <div style={{
        background: cardBg,
        border: `1px solid ${border}`,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.06)',
      }}>
        {/* Banner */}
        <div style={{
          height: 100,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #1e6bde 50%, #00c9a7 100%)',
          position: 'relative',
        }} />

        {/* Avatar + Info */}
        <div style={{ padding: '0 28px 24px', position: 'relative' }}>
          {/* Avatar circle */}
          <div style={{
            position: 'relative', display: 'inline-block',
            marginTop: -44,
          }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              border: `4px solid ${cardBg}`,
              overflow: 'hidden',
              background: avatar ? 'none' : (user?.role === 'admin'
                ? 'linear-gradient(135deg, #00c9a7, #1e6bde)'
                : 'linear-gradient(135deg, #f59f00, #d97706)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 700, color: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}>
              {avatar
                ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user?.name?.charAt(0).toUpperCase() || 'A'
              }
            </div>
            {/* Online dot */}
            <div style={{
              position: 'absolute', bottom: 6, right: 6,
              width: 16, height: 16, borderRadius: '50%',
              background: '#22c55e', border: `3px solid ${cardBg}`,
            }} />
          </div>

          {/* Name, email, role, joined */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: text, marginBottom: 4 }}>
              {user?.name || 'Admin'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <i className="bi bi-envelope" style={{ color: muted, fontSize: 12 }}></i>
              <span style={{ fontSize: 13, color: muted }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: user?.role === 'admin' ? 'rgba(0,201,167,0.12)' : 'rgba(245,159,0,0.12)',
                color: user?.role === 'admin' ? '#00c9a7' : '#f59f00',
                border: `1px solid ${user?.role === 'admin' ? 'rgba(0,201,167,0.3)' : 'rgba(245,159,0,0.3)'}`,
                borderRadius: 20, padding: '4px 14px',
                fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
              }}>
                {user?.role === 'admin' ? '👑' : '👤'} {user?.role === 'admin' ? 'Administrator' : 'Staff'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: muted }}>
                <i className="bi bi-calendar3"></i>
                Joined {joinDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        background: cardBg, border: `1px solid ${border}`,
        borderRadius: 14, padding: 6,
        display: 'flex', gap: 4, marginBottom: 20,
        boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '10px 8px',
              borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'all 0.2s',
              background: tab === t.key
                ? 'linear-gradient(135deg, #1e6bde, #00c9a7)'
                : 'transparent',
              color: tab === t.key ? '#fff' : muted,
              boxShadow: tab === t.key ? '0 4px 12px rgba(30,107,222,0.3)' : 'none',
            }}>
            <i className={`bi ${t.icon}`}></i>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{
        background: cardBg, border: `1px solid ${border}`,
        borderRadius: 20, padding: 28,
        boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.06)',
      }}>

        {/* EDIT PROFILE */}
        {tab === 'profile' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(30,107,222,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-person" style={{ color: '#1e6bde', fontSize: 16 }}></i>
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: text }}>Personal Information</span>
            </div>

            {/* Full Name */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-person" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: muted, fontSize: 14 }}></i>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  onFocus={e => e.target.style.border = '1px solid #1e6bde'}
                  onBlur={e => e.target.style.border = `1px solid ${inputBorder}`}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-envelope" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: muted, fontSize: 14 }}></i>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                  onFocus={e => e.target.style.border = '1px solid #1e6bde'}
                  onBlur={e => e.target.style.border = `1px solid ${inputBorder}`}
                />
              </div>
            </div>

            {/* Role (readonly) */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Role</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-shield-check" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: muted, fontSize: 14 }}></i>
                <input
                  style={{ ...inputStyle, cursor: 'not-allowed', opacity: 0.6 }}
                  value={user?.role === 'admin' ? 'Administrator' : 'Staff'}
                  readOnly
                />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: muted }}>
                  Cannot be changed
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 1, padding: '12px',
                background: saving ? '#94a3b8' : 'linear-gradient(135deg, #1e6bde, #00c9a7)',
                border: 'none', borderRadius: 12, color: '#fff',
                fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: saving ? 'none' : '0 4px 16px rgba(30,107,222,0.3)',
                transition: 'all 0.2s',
              }}>
                <i className="bi bi-check-lg"></i>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setForm({ name: user?.name || '', email: user?.email || '' })}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: `1px solid ${border}`,
                  borderRadius: 12, color: muted,
                  fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* CHANGE PASSWORD */}
        {tab === 'password' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-shield-lock" style={{ color: '#6366f1', fontSize: 16 }}></i>
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: text }}>Change Password</span>
            </div>

            {[
              { field: 'current', label: 'Current Password', placeholder: '••••••••' },
              { field: 'new',     label: 'New Password',     placeholder: 'Min 6 characters' },
              { field: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
            ].map(({ field, label, placeholder }) => (
              <div key={field} style={{ marginBottom: 18 }}>
                <label style={labelStyle}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-lock" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: muted, fontSize: 14 }}></i>
                  <input
                    style={inputStyle}
                    type="password"
                    value={pwd[field]}
                    onChange={e => setPwd(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    onFocus={e => e.target.style.border = '1px solid #6366f1'}
                    onBlur={e => e.target.style.border = `1px solid ${inputBorder}`}
                  />
                </div>
              </div>
            ))}

            {/* Strength bar */}
            {pwd.new && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 4,
                      background: i <= strength ? strengthColor : (darkMode ? '#334155' : '#e2e8f0'),
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 12, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</div>
              </div>
            )}

            <button onClick={handleChangePwd} disabled={changingPwd} style={{
              width: '100%', padding: '12px',
              background: changingPwd ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #00c9a7)',
              border: 'none', borderRadius: 12, color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: changingPwd ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: changingPwd ? 'none' : '0 4px 16px rgba(99,102,241,0.3)',
            }}>
              <i className="bi bi-shield-check"></i>
              {changingPwd ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        )}

        {/* CHOOSE AVATAR */}
        {tab === 'avatar' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,201,167,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-image" style={{ color: '#00c9a7', fontSize: 16 }}></i>
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: text }}>Choose Avatar</span>
            </div>

            {/* Current avatar preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, padding: 20, background: darkMode ? '#0f172a' : '#f8fafc', borderRadius: 14, border: `1px solid ${border}` }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                overflow: 'hidden',
                background: avatar ? 'none' : 'linear-gradient(135deg, #1e6bde, #00c9a7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: '#fff',
                border: `3px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                flexShrink: 0,
              }}>
                {avatar
                  ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user?.name?.charAt(0).toUpperCase() || 'A'
                }
              </div>
              <div>
                <div style={{ fontWeight: 600, color: text, marginBottom: 4 }}>Current Avatar</div>
                <div style={{ fontSize: 12, color: muted }}>Click button below to upload a new photo</div>
              </div>
            </div>

            {/* Upload button */}
            <label htmlFor="avatarFileInput" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #00c9a7, #1e6bde)',
              border: 'none', borderRadius: 12, color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,201,167,0.3)',
              marginBottom: 16,
            }}>
              <i className="bi bi-upload"></i>
              Upload Photo
            </label>
            <input
              id="avatarFileInput"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarFile}
            />

            {/* Remove avatar */}
            {avatar && (
              <button onClick={() => {
                setAvatar(null);
                localStorage.removeItem(`userAvatar_${user?.id}`);
                if (onAvatarChange) onAvatarChange(null);
                showToast('Avatar removed');
              }} style={{
                width: '100%', padding: '12px',
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 12, color: '#ef4444',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <i className="bi bi-trash"></i>
                Remove Avatar
              </button>
            )}

            <div style={{ marginTop: 16, padding: 14, background: darkMode ? '#0f172a' : '#f0fdf4', borderRadius: 10, border: `1px solid ${darkMode ? '#334155' : '#bbf7d0'}` }}>
              <div style={{ fontSize: 12, color: darkMode ? '#94a3b8' : '#16a34a', lineHeight: 1.6 }}>
                <i className="bi bi-info-circle" style={{ marginRight: 6 }}></i>
                Supported: JPG, PNG, GIF — Max size: 5MB
              </div>
            </div>
          </div>
        )}
      </div>

      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast({ msg: '', type: '' })} />
    </div>
  );
}