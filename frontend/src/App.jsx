import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  Package,
  AlertTriangle,
  CheckSquare,
  TrendingUp,
  Truck,
  BarChart3,
  FileText,
  Bell,
  Users,
  Settings,
  Shield,
  LogOut,
  Sun,
  Moon,
  ArrowRightLeft,
  Sliders,
  Play,
  RotateCcw,
  Search,
  Check,
  X,
  Plus,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (!token) {
    return <Login onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar user={user} onLogout={handleLogout} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header user={user} token={token} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard user={user} token={token} onLogout={handleLogout} />} />
              <Route path="/items" element={<Items token={token} onLogout={handleLogout} />} />
              <Route path="/items/:id" element={<ItemDetail token={token} user={user} onLogout={handleLogout} />} />
              <Route path="/replenishment" element={<Replenishment token={token} user={user} onLogout={handleLogout} />} />
              <Route path="/approvals" element={<Approvals token={token} user={user} onLogout={handleLogout} />} />
              <Route path="/forecasting" element={<Forecasting token={token} onLogout={handleLogout} />} />
              <Route path="/recommendations" element={<Recommendations token={token} user={user} onLogout={handleLogout} />} />
              <Route path="/outcomes" element={<Outcomes token={token} onLogout={handleLogout} />} />
              <Route path="/reports" element={<Reports token={token} onLogout={handleLogout} />} />
              <Route path="/notifications" element={<Notifications token={token} onLogout={handleLogout} />} />
              <Route path="/users" element={<UserManagement token={token} onLogout={handleLogout} />} />
              <Route path="/audit-logs" element={<AuditLogs token={token} onLogout={handleLogout} />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

// ----------------------------------------------------
// Header Component (with Notifications Drawer)
// ----------------------------------------------------
function Header({ user, token, onLogout, theme, toggleTheme }) {
  const [notifications, setNotifications] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Role: </span>
        <span className="badge badge-success" style={{ textTransform: 'none' }}>{user.role}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button onClick={toggleTheme} style={{
          background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer'
        }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowDrawer(!showDrawer)} style={{
            background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', position: 'relative'
          }}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'var(--danger)',
                color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold'
              }}>{unreadCount}</span>
            )}
          </button>

          {showDrawer && (
            <div className="notif-panel animate-fade-in">
              <div className="notif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notifications ({unreadCount} unread)</span>
                <button onClick={() => setShowDrawer(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No notifications.
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="notif-item" style={{
                    backgroundColor: n.is_read ? 'transparent' : 'rgba(79, 70, 229, 0.05)',
                    opacity: n.is_read ? 0.7 : 1
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{n.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.severity}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{n.message}</p>
                      {!n.is_read && (
                        <button onClick={() => markAsRead(n.id)} className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button onClick={onLogout} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
}

// ----------------------------------------------------
// Sidebar Component
// ----------------------------------------------------
function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['Procurement Manager', 'Inventory Planner', 'Warehouse User', 'Supplier', 'Finance Reviewer'] },
    { path: '/items', label: 'Item & Material View', icon: <Package size={18} />, roles: ['Procurement Manager', 'Inventory Planner', 'Warehouse User', 'Supplier', 'Finance Reviewer'] },
    { path: '/replenishment', label: 'Replenishment Planning', icon: <Sliders size={18} />, roles: ['Procurement Manager', 'Inventory Planner', 'Finance Reviewer'] },
    { path: '/approvals', label: 'Planner Approvals', icon: <CheckSquare size={18} />, roles: ['Procurement Manager', 'Inventory Planner', 'Finance Reviewer'] },
    { path: '/forecasting', label: 'Demand Forecasting', icon: <TrendingUp size={18} />, roles: ['Procurement Manager', 'Inventory Planner'] },
    { path: '/recommendations', label: 'Recommendations', icon: <Truck size={18} />, roles: ['Procurement Manager', 'Inventory Planner', 'Supplier'] },
    { path: '/outcomes', label: 'Accuracy & Outcomes', icon: <BarChart3 size={18} />, roles: ['Procurement Manager', 'Inventory Planner', 'Finance Reviewer'] },
    { path: '/reports', label: 'Reports & Analytics', icon: <FileText size={18} />, roles: ['Procurement Manager', 'Inventory Planner', 'Finance Reviewer'] },
    { path: '/users', label: 'User Management', icon: <Users size={18} />, roles: ['Procurement Manager', 'Finance Reviewer'] },
    { path: '/audit-logs', label: 'Audit & Settings', icon: <Shield size={18} />, roles: ['Procurement Manager', 'Finance Reviewer'] }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        M-OPTIMISER AI
      </div>
      <ul className="sidebar-menu">
        {menuItems.filter(item => item.roles.includes(user.role)).map(item => (
          <li key={item.path} className="sidebar-item">
            <Link to={item.path} className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}>
              {item.icon}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="sidebar-user">
        <Users size={16} />
        <div>
          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.first_name} {user.last_name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.role}</div>
        </div>
      </div>
    </aside>
  );
}

// ----------------------------------------------------
// Secure Login Page
// ----------------------------------------------------
function Login({ onLogin, theme, toggleTheme }) {
  const [email, setEmail] = useState('inventory_planner@hospital.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoRoles = [
    { email: 'procurement_mgr@hospital.com', role: 'Procurement Manager' },
    { email: 'inventory_planner@hospital.com', role: 'Inventory Planner' },
    { email: 'warehouse_user@hospital.com', role: 'Warehouse User' },
    { email: 'supplier_user@hospital.com', role: 'Supplier' },
    { email: 'finance_reviewer@hospital.com', role: 'Finance Reviewer' }
  ];

  return (
    <div className="login-page">
      <section className="login-intro" aria-label="Platform overview">
        <div className="login-intro-top">
          <div className="login-brand"><Activity size={22} /> MedSupply Ops</div>
          <span className="login-status"><span /> System online</span>
        </div>
        <div className="login-intro-copy">
          <p className="login-eyebrow"><Sparkles size={15} /> Operational intelligence</p>
          <h1>Medical Devices Demand, Inventory &amp; Procurement Optimiser</h1>
          <p className="login-summary">One workspace for planning demand, protecting critical stock, and making procurement decisions with confidence.</p>
        </div>
        <div className="login-capabilities">
          <div className="login-capability login-capability-teal"><div className="login-capability-icon"><TrendingUp size={21} /></div><div><strong>Plan demand</strong><span>Spot upcoming device needs early.</span></div></div>
          <div className="login-capability login-capability-amber"><div className="login-capability-icon"><Package size={21} /></div><div><strong>Protect inventory</strong><span>Keep safety stock and orders visible.</span></div></div>
          <div className="login-capability login-capability-violet"><div className="login-capability-icon"><Shield size={21} /></div><div><strong>Review decisions</strong><span>Approve recommendations with audit trails.</span></div></div>
        </div>
        <p className="login-intro-footer"><Check size={16} /> Role-based access for supply, warehouse, and finance teams.</p>
      </section>

      <main className="login-panel">
        <div className="login-panel-inner">
          <div className="login-panel-header">
            <div><p className="login-panel-kicker">Secure workspace</p><h2>Welcome back</h2><p>Sign in to continue to your operational dashboard.</p></div>
            <button onClick={toggleTheme} className="login-theme-button" aria-label="Toggle color theme" title="Toggle color theme">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
          {error && <div className="login-error" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group"><label className="form-label" htmlFor="login-email">Work email</label><input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" required /></div>
            <div className="form-group login-password-field"><label className="form-label" htmlFor="login-password">Password</label><input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="form-control" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="login-password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            <div className="login-options"><label><input type="checkbox" defaultChecked /> Remember me</label><a href="#">Forgot password?</a></div>
            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>{loading ? 'Signing in...' : <>Sign in <ArrowRight size={18} /></>}</button>
          </form>
          <div className="login-demo"><p>Explore with a demo role <span>Password: password123</span></p><div className="login-demo-roles">{demoRoles.map(r => <button key={r.email} type="button" onClick={() => { setEmail(r.email); setPassword('password123'); }}>{r.role}</button>)}</div></div>
        </div>
        <p className="login-panel-footer"><Shield size={15} /> Protected operational data</p>
      </main>
    </div>
  );
}

// ----------------------------------------------------
// Page 2: Demand, Supply and Inventory Dashboard Page
// ----------------------------------------------------
function Dashboard({ user, token, onLogout }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
          onLogout();
          return;
        }
        const data = await res.json();
        if (data && !data.error) {
          setSummary(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSummary();
  }, [token]);

  if (!summary || !summary.metrics) return <div>Loading dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <h1 className="page-title">Executive Demand, Supply & Inventory Dashboard</h1>
        <span style={{ color: 'var(--text-secondary)' }}>Real-time Operations View</span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>LOW STOCK ALERTS</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--danger)', margin: '0.5rem 0' }}>{summary.low_stock_alerts}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Items below safety stock threshold</span>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>OPEN CAPAs</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning)', margin: '0.5rem 0' }}>{summary.open_capas}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active quality corrective actions</span>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>SUPPLY CHAIN RISKS</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--info)', margin: '0.5rem 0' }}>{summary.active_risks}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supplier and lead time delays</span>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PENDING AI RECOMMENDATIONS</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-hover)', margin: '0.5rem 0' }}>{summary.pending_ai_recs}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Requires review & sign-off</span>
        </div>
      </div>

      {/* Quality Driver Cards */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>Operational Demand Drivers & Quality Metrics</h2>
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="card-title">Production Yield Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{summary.metrics.yield_rate}%</div>
          <div style={{ height: '4px', backgroundColor: 'var(--border-color)', marginTop: '0.5rem', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${summary.metrics.yield_rate}%`, backgroundColor: 'var(--success)' }}></div>
          </div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="card-title">Defect Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{summary.metrics.defect_rate}%</div>
          <div style={{ height: '4px', backgroundColor: 'var(--border-color)', marginTop: '0.5rem', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${summary.metrics.defect_rate * 10}%`, backgroundColor: 'var(--danger)' }}></div>
          </div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="card-title">Device Uptime</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{summary.metrics.device_uptime}%</div>
          <div style={{ height: '4px', backgroundColor: 'var(--border-color)', marginTop: '0.5rem', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${summary.metrics.device_uptime}%`, backgroundColor: 'var(--info)' }}></div>
          </div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="card-title">Service Turnaround</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{summary.metrics.service_turnaround} Days</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average repair time</span>
        </div>
      </div>

      {/* SVG demand chart */}
      <div className="grid-cols-2">
        <div className="card">
          <div className="card-title">Global Demand & Forecast Projection</div>
          <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem', padding: '1rem 0' }}>
            {/* Displaying simple SVG chart or bars */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--primary)', opacity: 0.7, borderRadius: '4px' }}></div>
              <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Q1 Actual</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '140px', backgroundColor: 'var(--primary)', opacity: 0.7, borderRadius: '4px' }}></div>
              <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Q2 Actual</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '160px', backgroundColor: 'var(--primary)', opacity: 0.7, borderRadius: '4px' }}></div>
              <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Q3 Actual</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '195px', backgroundColor: 'var(--info)', borderRadius: '4px', border: '1px dashed white' }}></div>
              <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 'bold' }}>Q4 Forecast (AI)</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Active Action Items & Alerts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertTriangle color="var(--danger)" size={18} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Oxygen Flow Sensor critically low</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: Warehouse A | Stock: 120 (Safety: 150)</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <AlertTriangle color="var(--warning)" size={18} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Expired material warning: Gas Cylinder</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch LOT-55443 expires on 2026-09-30</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Page 3: Item and Material List View
// ----------------------------------------------------
function Items({ token, onLogout }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const query = new URLSearchParams({ search, category }).toString();
        const res = await fetch(`${API_BASE}/items?${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
          onLogout();
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchItems();
  }, [search, category, token]);

  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <h1 className="page-title">Medical Device Components & Materials</h1>
      </div>

      {/* Filter and Search controls */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <input type="text" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="form-control" style={{ paddingLeft: '2.5rem' }} />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
        </div>
        <div style={{ width: '200px' }}>
          <select value={category} onChange={e => setCategory(e.target.value)} className="form-control">
            <option value="">All Categories</option>
            <option value="sensors">Sensors</option>
            <option value="components">Components</option>
            <option value="packaging">Packaging</option>
            <option value="spare parts">Spare Parts</option>
            <option value="calibration materials">Calibration Materials</option>
            <option value="finished devices">Finished Devices</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Safety Stock</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const isLow = item.current_stock < item.safety_stock;
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: '600' }}>{item.sku}</td>
                  <td>{item.name}</td>
                  <td><span className="badge badge-success" style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>{item.category}</span></td>
                  <td>{item.current_stock} {item.unit}</td>
                  <td>{item.safety_stock} {item.unit}</td>
                  <td>{item.location}</td>
                  <td>
                    {isLow ? (
                      <span className="badge badge-danger">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">Optimal</span>
                    )}
                  </td>
                  <td>
                    <Link to={`/items/${item.id}`} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                      View Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Page 3: Item Detail and Stock History View
// ----------------------------------------------------
function ItemDetail({ token, user, onLogout }) {
  const { id } = useNavigate(); // wait, we should get id from useParams in React Router
  const locationPath = useLocation();
  const itemId = locationPath.pathname.split('/').pop();

  const [item, setItem] = useState(null);
  const [forecasting, setForecasting] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`${API_BASE}/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (data && !data.error) {
        setItem(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [itemId, token]);

  const triggerForecast = async () => {
    setForecasting(true);
    try {
      await fetch(`${API_BASE}/ai/forecast/${item.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDetail();
    } catch (e) {
      console.error(e);
    } finally {
      setForecasting(false);
    }
  };

  if (!item) return <div>Loading item specifications...</div>;

  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <div>
          <h1 className="page-title">{item.name}</h1>
          <span style={{ color: 'var(--text-secondary)' }}>SKU: {item.sku} | Category: {item.category}</span>
        </div>
        {['Procurement Manager', 'Inventory Planner'].includes(user.role) && (
          <button onClick={triggerForecast} className="btn btn-primary" disabled={forecasting}>
            {forecasting ? 'Running AI Model...' : 'Trigger AI Demand Forecast'}
          </button>
        )}
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-title">Inventory Health Check</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Current Stock:</span>
              <span style={{ fontWeight: 'bold' }}>{item.current_stock}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Safety Stock Target:</span>
              <span>{item.safety_stock}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Open Orders:</span>
              <span>{item.open_orders}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Reserved Stock:</span>
              <span>{item.reserved_quantity}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Batch & Expiry</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Active Lot Number:</span>
              <span>{item.lot_number || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Batch Expiry Date:</span>
              <span style={{ color: 'var(--warning)', fontWeight: '600' }}>{item.expiry_date || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Batch Age:</span>
              <span>{item.age_days} Days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Warehouse Location:</span>
              <span>{item.location} ({item.bin || 'Unbin'})</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Commercial Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Unit Cost:</span>
              <span>${item.unit_cost.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Asset Value:</span>
              <span>${(item.current_stock * item.unit_cost).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Standard Lead Time:</span>
              <span>{item.lead_time_days} Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Show Forecast list if available */}
      {item.forecasts && item.forecasts.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-title">Recent Gemini AI Demand Forecasts</div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Forecast Target Month</th>
                  <th>Forecasted Quantity</th>
                  <th>Confidence Score</th>
                  <th>AI Explanation</th>
                  <th>Model / Version</th>
                </tr>
              </thead>
              <tbody>
                {item.forecasts.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 'bold' }}>{f.forecast_date}</td>
                    <td>{f.forecasted_quantity} units</td>
                    <td>{(f.confidence_score * 100).toFixed(0)}%</td>
                    <td>{f.explanation}</td>
                    <td>{f.model_version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock movements history */}
      <div className="grid-cols-2">
        <div className="card">
          <div className="card-title">Recent Stock Movements</div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {item.movements && item.movements.map(m => (
                  <tr key={m.id}>
                    <td>
                      <span className={`badge ${m.type === 'Receipt' ? 'badge-success' : 'badge-warning'}`}>{m.type}</span>
                    </td>
                    <td>{m.quantity}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Quality Inspection Records</div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Inspection Date</th>
                  <th>Pass/Fail</th>
                  <th>Defect Info</th>
                </tr>
              </thead>
              <tbody>
                {item.inspections && item.inspections.map(i => (
                  <tr key={i.id}>
                    <td>{i.inspection_date}</td>
                    <td>
                      <span className={`badge ${i.status === 'Passed' ? 'badge-success' : 'badge-danger'}`}>{i.status}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{i.defect_type || 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Page 4: Replenishment Planning Workbench
// ----------------------------------------------------
function Replenishment({ token, user, onLogout }) {
  const [recs, setRecs] = useState([]);
  const [simSafetyStock, setSimSafetyStock] = useState(150);
  const [simLeadTime, setSimLeadTime] = useState(5);
  const [simulatedStockoutRisk, setSimulatedStockoutRisk] = useState('Low');

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await fetch(`${API_BASE}/planning/recommendations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
          onLogout();
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setRecs(data.filter(r => r.type === 'Reorder' && r.status === 'Pending Review'));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRecs();
  }, [token]);

  const handleSimulate = () => {
    // Basic scenario simulation logic
    if (simLeadTime > 10 || simSafetyStock < 100) {
      setSimulatedStockoutRisk('High Risk (Deficit Potential)');
    } else {
      setSimulatedStockoutRisk('Optimal Coverage (Low Risk)');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <h1 className="page-title">Replenishment & Purchase Planning Workbench</h1>
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-title">Pending Purchase Replenishment Proposals</div>
          {recs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>All inventory levels are currently within safe operational parameters. No pending reorders.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Confidence</th>
                    <th>Recommendation Summary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recs.map(r => (
                    <tr key={r.id}>
                      <td>{r.target_entity_id}</td>
                      <td>{(r.confidence_score * 100).toFixed(0)}%</td>
                      <td>{r.explanation}</td>
                      <td>
                        <Link to="/approvals" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                          Approve / Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Supply Chain Scenario Simulator</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Simulation Safety Stock Target</label>
              <input type="number" value={simSafetyStock} onChange={e => setSimSafetyStock(Number(e.target.value))} className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Simulation Supplier Lead Time (Days)</label>
              <input type="number" value={simLeadTime} onChange={e => setSimLeadTime(Number(e.target.value))} className="form-control" />
            </div>

            <button onClick={handleSimulate} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <RotateCcw size={16} /> Run Simulation
            </button>

            <div style={{
              marginTop: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)',
              backgroundColor: simulatedStockoutRisk.includes('High') ? 'var(--danger-glow)' : 'var(--success-glow)',
              color: simulatedStockoutRisk.includes('High') ? 'var(--danger)' : 'var(--success)',
              textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem'
            }}>
              Risk Status: {simulatedStockoutRisk}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Page 5: Planner Approval and Override Page
// ----------------------------------------------------
function Approvals({ token, user, onLogout }) {
  const [recs, setRecs] = useState([]);
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideQty, setOverrideQty] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRecs = async () => {
    try {
      const res = await fetch(`${API_BASE}/planning/recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, [token]);

  const handleApprove = async (id) => {
    try {
      await fetch(`${API_BASE}/planning/recommendations/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRecs();
    } catch (e) {
      console.error(e);
    }
  };

  const submitOverride = async () => {
    if (!overrideReason) return;
    try {
      await fetch(`${API_BASE}/planning/recommendations/${overrideModal.id}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: overrideReason, quantity: overrideQty })
      });
      setOverrideModal(null);
      setOverrideReason('');
      setOverrideQty('');
      fetchRecs();
    } catch (e) {
      console.error(e);
    }
  };

  const submitReject = async () => {
    if (!rejectReason) return;
    try {
      await fetch(`${API_BASE}/planning/recommendations/${rejectModal.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      setRejectModal(null);
      setRejectReason('');
      fetchRecs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <h1 className="page-title">Planner Recommendations Approval</h1>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Target Entity</th>
              <th>Recommendation details</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recs.map(r => (
              <tr key={r.id}>
                <td><span className="badge badge-warning" style={{ textTransform: 'none' }}>{r.type}</span></td>
                <td>{r.target_entity_id}</td>
                <td>{r.explanation}</td>
                <td>{(r.confidence_score * 100).toFixed(0)}%</td>
                <td>
                  <span className={`badge ${
                    r.status === 'Approved' ? 'badge-success' : 
                    r.status === 'Rejected' ? 'badge-danger' : 
                    r.status === 'Overridden' ? 'badge-warning' : 'badge-secondary'
                  }`}>{r.status}</span>
                </td>
                <td>
                  {r.status === 'Pending Review' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleApprove(r.id)} className="btn btn-success" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                        Approve
                      </button>
                      <button onClick={() => { setOverrideModal(r); setOverrideQty(JSON.parse(r.recommendation_data).reorder_quantity || ''); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                        Override
                      </button>
                      <button onClick={() => setRejectModal(r)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '450px', padding: '2rem' }}>
            <div className="card-title">Override AI Recommendation</div>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Adjust replenishment specifications. All overrides will be logged in the audit history.
            </p>
            <div className="form-group">
              <label className="form-label">Quantity Adjustment Override</label>
              <input type="number" value={overrideQty} onChange={e => setOverrideQty(e.target.value)} className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Justification / Override Reason</label>
              <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)} className="form-control" rows={3} placeholder="Provide engineering or supply justification..." required></textarea>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setOverrideModal(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={submitOverride} className="btn btn-primary" disabled={!overrideReason}>Confirm Override</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '450px', padding: '2rem' }}>
            <div className="card-title">Reject AI Proposal</div>
            <div className="form-group">
              <label className="form-label">Reason for Rejection</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="form-control" rows={3} placeholder="Please provide details for auditing..." required></textarea>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setRejectModal(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={submitReject} className="btn btn-danger" disabled={!rejectReason}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Page 6: Demand Forecasting and Safety Stock Page
// ----------------------------------------------------
function Forecasting({ token }) {
  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <h1 className="page-title">Demand Forecasting & Safety Stock Modelling</h1>
      </div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-title">Predictive Demand Forecast Model (12-Month Interval)</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Select items from the material page to run custom predictions. The charts below display the demand variance interval model outputs.
        </p>
        <div style={{ height: '250px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Historical & Forecast demand curve visualizer</span>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Page 7: Reorder, Transfer & Supplier Recommendations
// ----------------------------------------------------
function Recommendations({ token, user, onLogout }) {
  const [suppliers, setSuppliers] = useState([]);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch(`${API_BASE}/suppliers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
          onLogout();
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuppliers(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSuppliers();
  }, [token]);

  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <h1 className="page-title">Supplier Evaluations & Risk Scoring</h1>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-title">Supplier Qualification Scorecard</div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Quality Score</th>
                  <th>Reliability</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 'bold' }}>{s.name}</td>
                    <td>{s.quality_score}%</td>
                    <td>{s.delivery_reliability}%</td>
                    <td style={{ color: s.risk_score > 5 ? 'var(--danger)' : 'var(--text-primary)' }}>{s.risk_score}</td>
                    <td>
                      <span className={`badge ${s.status === 'Qualified' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Risk Scoring System</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
            Risk scoring is calculated dynamically based on quality inspection pass rates, historical delivery reliability metrics, and CAPA resolution timelines.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <strong>Low Risk (0 - 3):</strong> Stable deliveries & standard quality certifications.
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <strong>Medium Risk (3 - 6):</strong> Delivery delay warnings or open inspection items.
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <strong>High Risk (6 - 10):</strong> Ongoing defect rates and CAPA failures. Require sourcing alternatives.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Page 8: Inventory Outcomes & Forecast Accuracy Page
// ----------------------------------------------------
function Outcomes() {
  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <h1 className="page-title">Inventory Outcomes & Forecast Accuracy</h1>
      </div>
      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-title">Forecast Model Performance (MAPE)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Average Forecast Error (MAPE):</span>
              <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>5.8%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>AI Adoption Rate:</span>
              <span>92% (Planners accepted)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Downtime Prevented:</span>
              <span>180 Hours (Estimated)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Page 9: Reports and Analytics Page
// ----------------------------------------------------
function Reports() {
  const handleExport = () => {
    // Mock export download trigger
    alert('Exporting filtered demand/inventory reports in CSV format...');
  };

  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <h1 className="page-title">Reports & Operational Analytics</h1>
        <button onClick={handleExport} className="btn btn-primary">Export Report (CSV)</button>
      </div>
      <div className="card">
        <div className="card-title">Report Configurations</div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Review inventory cost structure, warehouse movement logs, and defect/CAPA trend breakdowns.
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Page 10: Notifications Page
// ----------------------------------------------------
function Notifications({ token, onLogout }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`${API_BASE}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
          onLogout();
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchNotifs();
  }, [token]);

  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <h1 className="page-title">System & AI Notifications</h1>
      </div>
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              padding: '1rem', borderBottom: '1px solid var(--border-color)',
              opacity: n.is_read ? 0.6 : 1
            }}>
              <div style={{ fontWeight: 'bold' }}>{n.title}</div>
              <p>{n.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Page 11: User and Role Management Page
// ----------------------------------------------------
function UserManagement({ token, onLogout }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
          onLogout();
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUsers();
  }, [token]);

  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <h1 className="page-title">User & Role Management</h1>
      </div>
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 'bold' }}>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.status}</td>
                <td>{u.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Page 12: Audit Logs and System Settings Page
// ----------------------------------------------------
function AuditLogs({ token, onLogout }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_BASE}/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
          onLogout();
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchLogs();
  }, [token]);

  return (
    <div className="animate-fade-in">
      <div className="header-bar">
        <h1 className="page-title">Audit Trails & Logs</h1>
      </div>
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Action</th>
              <th>Entity Type</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td>{l.user_id}</td>
                <td style={{ fontWeight: 'bold' }}>{l.action}</td>
                <td>{l.entity_type}</td>
                <td>{l.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
