import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import LoginPage        from './pages/LoginPage';
import DashboardPage    from './pages/DashboardPage';
import InventoryPage    from './pages/InventoryPage';
import SuppliersPage    from './pages/SuppliersPage';
import ReportsPage      from './pages/ReportsPage';
import UsersPage        from './pages/UsersPage';
import PurchasePage     from './pages/PurchasePage';
import ProfileSettings  from './pages/ProfileSettings';
import Layout           from './components/Layout';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // ✅ Avatar per user — key តាម user ID
  const [avatar, setAvatar] = useState(() => {
    const saved = localStorage.getItem('user');
    const u = saved ? JSON.parse(saved) : null;
    return u ? localStorage.getItem(`userAvatar_${u.id}`) || null : null;
  });

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  React.useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.body.style.background = darkMode ? '#0a0f1e' : '#f4f6fb';
    document.body.style.color      = darkMode ? '#e2e8f0' : '#1c2b3a';
  }, [darkMode]);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
    // ✅ Load avatar តាម user ID — គ្រប់ user មាន avatar ខ្លួនឯង
    const savedAvatar = localStorage.getItem(`userAvatar_${userData.id}`) || null;
    setAvatar(savedAvatar);
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // ✅ មិនលុប userAvatar — avatar នៅស្ថិតស្ថេរ បន្ទាប់ពី login វិញ
    setUser(null);
    // មិន reset avatar ដែរ
  };

  // ✅ ProfileSettings នឹង call function នេះ ពេល avatar ផ្លាស់ប្តូរ
  const handleAvatarChange = (newAvatar) => {
    setAvatar(newAvatar);
    if (user?.id) localStorage.setItem(`userAvatar_${user.id}`, newAvatar);
  };

  if (!user) return <LoginPage onLogin={handleLogin} darkMode={darkMode} />;

  const AccessDenied = () => (
    <div className="text-center py-5">
      <i className="bi bi-shield-lock fs-1 text-warning d-block mb-3"></i>
      <h5 className="fw-bold">Access Denied</h5>
      <p className="text-muted">Only Admin can access this page.</p>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage    darkMode={darkMode} />;
      case 'inventory': return <InventoryPage    darkMode={darkMode} />;
      case 'suppliers': return <SuppliersPage    darkMode={darkMode} />;
      case 'purchases': return <PurchasePage     darkMode={darkMode} />;
      case 'reports':   return user.role==='admin' ? <ReportsPage  darkMode={darkMode} /> : <AccessDenied />;
      case 'users':     return user.role==='admin' ? <UsersPage    darkMode={darkMode} /> : <AccessDenied />;
      case 'profile':   return (
        <ProfileSettings
          darkMode={darkMode}
          user={user}
          setUser={setUser}
          onAvatarChange={handleAvatarChange} // ✅ pass ទៅ ProfileSettings
        />
      );
      default: return <DashboardPage darkMode={darkMode} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
      user={user}
      avatar={avatar}        // ✅ pass avatar ទៅ Layout → Sidebar → Navbar
      darkMode={darkMode}
      onToggleDark={() => setDarkMode(d => !d)}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;