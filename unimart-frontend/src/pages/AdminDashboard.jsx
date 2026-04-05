import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Users, Radio, UtensilsCrossed, RefreshCw,
  Ban, CheckCircle, Coins, XCircle, Power, Menu, X, ShieldAlert,
  TrendingUp, Package, ChevronRight, Plus, Trash2, AlertTriangle,
  IndianRupee, Search, User, Home, Loader2
} from 'lucide-react';

// ─── Centralised admin API service (auth + interceptors handled there) ──────
import {
  fetchDashboardStats,
  fetchAllUsers,
  fetchUserOrderHistory,
  toggleUserBan,
  adjustUserCoins,
  fetchLiveOrders,
  cancelLiveOrder,
  fetchAllCanteens,
  createCanteen,
  toggleCanteenStatus,
} from '../services/adminApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const shortId = (id) => String(id).slice(-6).toUpperCase();

const STATUS_STEPS = {
  PENDING: { label: 'Step 1 – Awaiting Runner', color: 'text-yellow-400', bg: 'bg-yellow-400/10', pulse: true },
  ACCEPTED: { label: 'Step 2 – Runner En Route', color: 'text-blue-400', bg: 'bg-blue-400/10', pulse: true },
  PICKED_UP: { label: 'Step 3 – Food Picked Up', color: 'text-orange-400', bg: 'bg-orange-400/10', pulse: true },
  DELIVERED: { label: 'Step 4 – Delivered', color: 'text-emerald-400', bg: 'bg-emerald-400/10', pulse: false },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-400/10', pulse: false },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const AccessDeniedOverlay = ({ onRetry }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white">
    <ShieldAlert size={64} className="text-red-500 mb-6" />
    <h1 className="text-3xl font-black mb-2">403 – Access Denied</h1>
    <p className="text-slate-400 mb-8 text-center max-w-sm">
      You don't have admin clearance to access HQ Command Centre.
    </p>
    <button onClick={onRetry} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors">
      Go Back
    </button>
  </div>
);

const StatCard = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${accent} bg-opacity-10`}>
        <Icon size={22} className={accent.replace('bg-', 'text-').replace('/10', '')} />
      </div>
      <ChevronRight size={16} className="text-slate-300 mt-1" />
    </div>
    <p className="text-3xl font-black text-slate-800 mb-1">{value}</p>
    <p className="text-sm font-semibold text-slate-500">{label}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Data
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [platformRevenue, setPlatformRevenue] = useState(0);

  // UI
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  // Search
  const [userSearch, setUserSearch] = useState('');

  // Coin modal
  const [coinModal, setCoinModal] = useState(null);
  const [coinAmount, setCoinAmount] = useState('');
  const [coinAction, setCoinAction] = useState('add');

  // History modal
  const [historyModal, setHistoryModal] = useState(null);  // { user, data } | null
  const [historyLoading, setHistoryLoading] = useState(false);

  // Add Canteen modal
  const [addCanteenModal, setAddCanteenModal] = useState(false);
  const [newCanteen, setNewCanteen] = useState({ name: '', location: '', packingFee: '' });
  const [menuCategories, setMenuCategories] = useState([{ categoryName: '', items: [{ name: '', price: '', isVeg: true }] }]);
  const [canteenSubmitting, setCanteenSubmitting] = useState(false);

  // Track which tabs have been fetched to avoid redundant calls
  const fetched = useRef(new Set());

  // ─── Error handler ──────────────────────────────────────────────────────────
  const handleError = (err, fallbackTab) => {
    if (err?.status === 403 || err?.message === 'FORBIDDEN') {
      setAccessDenied(true);
      return;
    }
    console.error(`[AdminDashboard] Error on tab "${fallbackTab}":`, err);
    setError(`Failed to load ${fallbackTab} data. Check your connection.`);
  };

  // ─── Data fetching ──────────────────────────────────────────────────────────
  const fetchDataForTab = useCallback(async (tab, forceRefresh = false) => {
    if (!forceRefresh && fetched.current.has(tab)) return;

    setLoading(true);
    setError(null);
    try {
      if (tab === 'stats') {
        const data = await fetchDashboardStats();
        setStats(data);

        // Revenue estimate: accepted/picked-up orders × ₹5
        const live = await fetchLiveOrders();
        const accepted = live.filter(o => o.status !== 'PENDING').length;
        setPlatformRevenue(accepted * 5);
        setOrders(live); // pre-populate orders tab cache
        fetched.current.add('orders');

      } else if (tab === 'orders') {
        const data = await fetchLiveOrders();
        setOrders(data);

      } else if (tab === 'users') {
        const data = await fetchAllUsers({ limit: 100 });
        setUsers(data);

      } else if (tab === 'canteens') {
        const data = await fetchAllCanteens();
        setCanteens(data);
      }

      fetched.current.add(tab);
    } catch (err) {
      handleError(err, tab);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch whenever the active tab changes
  useEffect(() => {
    fetchDataForTab(activeTab);
  }, [activeTab, fetchDataForTab]);

  // ─── Action: Ban/Unban ──────────────────────────────────────────────────────
  const handleToggleBan = async (userId, currentStatus) => {
    setActionLoading(`ban-${userId}`);
    try {
      await toggleUserBan(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: !currentStatus } : u));
    } catch (err) { handleError(err, 'users'); }
    finally { setActionLoading(null); }
  };

  // ─── Action: View Order History ─────────────────────────────────────────────
  const handleViewHistory = async (user) => {
    setHistoryModal({ user, data: null });
    setHistoryLoading(true);
    try {
      const data = await fetchUserOrderHistory(user._id);
      setHistoryModal({ user, data });
    } catch (err) {
      handleError(err, 'users');
      setHistoryModal(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ─── Action: Adjust Coins ───────────────────────────────────────────────────
  const openCoinModal = (user) => {
    setCoinModal({ userId: user._id, name: user.name, balance: user.uniCoins });
    setCoinAmount('');
    setCoinAction('add');
  };

  const handleAdjustCoins = async () => {
    const amount = parseInt(coinAmount, 10);
    if (!amount || amount <= 0) return;
    setActionLoading(`coin-${coinModal.userId}`);
    try {
      const updated = await adjustUserCoins(coinModal.userId, coinAction, amount);
      setUsers(prev => prev.map(u => u._id === coinModal.userId ? { ...u, uniCoins: updated.uniCoins } : u));
      setCoinModal(null);
    } catch (err) {
      handleError(err, 'users');
      if (err?.status !== 403) alert(err?.response?.data?.error || 'Failed to adjust coins');
    } finally { setActionLoading(null); }
  };

  // ─── Action: Cancel Order ───────────────────────────────────────────────────
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('⚠️ Cancel this order and issue all refunds?')) return;
    setActionLoading(`cancel-${orderId}`);
    try {
      await cancelLiveOrder(orderId);
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch (err) { handleError(err, 'orders'); }
    finally { setActionLoading(null); }
  };

  // ─── Action: Toggle Canteen ─────────────────────────────────────────────────
  const handleToggleCanteen = async (canteenId, currentStatus) => {
    setActionLoading(`canteen-${canteenId}`);
    try {
      await toggleCanteenStatus(canteenId);
      setCanteens(prev => prev.map(c => c._id === canteenId ? { ...c, isOpen: !currentStatus } : c));
    } catch (err) { handleError(err, 'canteens'); }
    finally { setActionLoading(null); }
  };

  // ─── Action: Create Canteen ─────────────────────────────────────────────────
  const addCategory = () => setMenuCategories(p => [...p, { categoryName: '', items: [{ name: '', price: '', isVeg: true }] }]);
  const removeCategory = (ci) => setMenuCategories(p => p.filter((_, i) => i !== ci));
  const updateCategory = (ci, v) => setMenuCategories(p => p.map((c, i) => i === ci ? { ...c, categoryName: v } : c));
  const addItem = (ci) => setMenuCategories(p => p.map((c, i) => i === ci ? { ...c, items: [...c.items, { name: '', price: '', isVeg: true }] } : c));
  const removeItem = (ci, ii) => setMenuCategories(p => p.map((c, i) => i === ci ? { ...c, items: c.items.filter((_, j) => j !== ii) } : c));
  const updateItem = (ci, ii, field, val) => setMenuCategories(p => p.map((c, i) => i === ci ? { ...c, items: c.items.map((item, j) => j === ii ? { ...item, [field]: val } : item) } : c));

  const handleCreateCanteen = async () => {
    if (!newCanteen.name.trim() || !newCanteen.location.trim()) {
      alert('Name and location are required');
      return;
    }
    setCanteenSubmitting(true);
    try {
      const validMenu = menuCategories
        .filter(cat => cat.categoryName.trim())
        .map(cat => ({
          categoryName: cat.categoryName,
          items: cat.items
            .filter(item => item.name.trim() && item.price)
            .map(item => ({ name: item.name, price: parseFloat(item.price), isVeg: item.isVeg, isAvailable: true }))
        }));

      const created = await createCanteen({
        name: newCanteen.name,
        location: newCanteen.location,
        packingFee: parseFloat(newCanteen.packingFee) || 0,
        menu: validMenu,
      });
      setCanteens(prev => [created, ...prev]);
      setAddCanteenModal(false);
      setNewCanteen({ name: '', location: '', packingFee: '' });
      setMenuCategories([{ categoryName: '', items: [{ name: '', price: '', isVeg: true }] }]);
    } catch (err) {
      handleError(err, 'canteens');
      if (err?.status !== 403) alert(err?.response?.data?.error || 'Failed to create canteen');
    } finally { setCanteenSubmitting(false); }
  };

  // ─── Derived state ──────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.hostel?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const navItems = [
    { id: 'stats', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'users', icon: Users, label: 'User Control' },
    { id: 'orders', icon: Radio, label: 'Live Radar' },
    { id: 'canteens', icon: UtensilsCrossed, label: 'Canteens' },
  ];
  const tabTitles = {
    stats: 'Analytics Dashboard', users: 'User Control',
    orders: 'Live Order Radar', canteens: 'Canteen Control',
  };

  // ─── 403 Overlay ────────────────────────────────────────────────────────────
  if (accessDenied) return <AccessDeniedOverlay onRetry={() => window.history.back()} />;

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed top-0 left-0 h-full z-30 w-72 bg-slate-900 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>

        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <ShieldAlert size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-wider">HQ COMMAND</p>
              <p className="text-slate-500 text-xs">theunitmart.in</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 text-left ${activeTab === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Icon size={18} />
              {label}
              {id === 'orders' && orders.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{orders.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Platform Revenue */}
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={14} className="text-emerald-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Revenue</p>
          </div>
          <p className="text-2xl font-black text-emerald-400">₹{platformRevenue}</p>
          <p className="text-xs text-slate-500 mt-1">₹5 × accepted orders</p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-800">{tabTitles[activeTab]}</h1>
              <p className="text-xs text-slate-400 hidden sm:block">HQ Command · Antigravity</p>
            </div>
          </div>
          <button
            onClick={() => { fetched.current.delete(activeTab); fetchDataForTab(activeTab, true); }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">

          {/* Error banner */}
          {error && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              <AlertTriangle size={16} className="shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
            </div>
          )}

          {/* Loading spinner */}
          {loading && (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          )}

          {/* ════════════════ PILLAR 1: STATS ════════════════ */}
          {!loading && activeTab === 'stats' && (
            <div className="space-y-8 animate-[fadeInUp_0.4s_ease_forwards]">
              {stats ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    <StatCard icon={Users} label="Total Registered Users" value={stats.totalUsers?.toLocaleString() ?? '—'} accent="bg-blue-500" sub={`${stats.bannedUsers ?? 0} currently banned`} />
                    <StatCard icon={Package} label="Active Orders" value={stats.liveOrders ?? '—'} accent="bg-emerald-500" sub="PENDING + ACCEPTED + PICKED_UP" />
                    <StatCard icon={Coins} label="Total UniCoins in Circulation" value={`${(stats.totalCirculatingCoins ?? 0).toLocaleString()} UC`} accent="bg-yellow-500" sub="Aggregate wallet balance" />
                  </div>

                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp size={18} className="text-blue-600" />
                      <h2 className="font-bold text-slate-700">Platform Snapshot</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      {[
                        { label: 'Total Users', val: stats.totalUsers },
                        { label: 'Banned', val: stats.bannedUsers, danger: true },
                        { label: 'Live Orders', val: stats.liveOrders },
                        { label: 'Sys. Liquidity', val: `${stats.totalCirculatingCoins} UC` },
                      ].map(item => (
                        <div key={item.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <p className={`text-xl font-black ${item.danger && item.val > 0 ? 'text-red-500' : 'text-slate-800'}`}>{item.val}</p>
                          <p className="text-xs text-slate-500 mt-1 font-medium">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                  <AlertTriangle size={32} className="mb-3" />
                  <p className="font-semibold">No stats available — check backend connection</p>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ PILLAR 2: USERS ════════════════ */}
          {!loading && activeTab === 'users' && (
            <div className="space-y-5 animate-[fadeInUp_0.4s_ease_forwards]">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, hostel or email…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>

              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  <span className="font-bold text-slate-700">{filteredUsers.length} users</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[640px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {['Student', 'Hostel', 'UniCoins Balance', 'History', 'Actions'].map(h => (
                          <th key={h} className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">
                            {userSearch ? `No users matching "${userSearch}"` : 'No users found'}
                          </td>
                        </tr>
                      ) : filteredUsers.map(u => (
                        <tr key={u._id} className={`hover:bg-slate-50/80 transition-colors ${u.isBanned ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${u.isBanned ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-600'}`}>
                                {u.name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">{u.name}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Home size={13} className="text-slate-400" />
                              <span className="font-medium text-slate-600">{u.hostel ?? '—'} {u.roomNumber ?? ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-yellow-600">{u.uniCoins ?? 0}</span>
                              <span className="text-xs text-slate-400 font-medium">UC</span>
                              <button
                                onClick={() => openCoinModal(u)}
                                className="ml-2 flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 rounded-lg text-xs font-bold transition-colors"
                              >
                                <Coins size={12} /> Adjust
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewHistory(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all"
                            >
                              <Package size={12} /> History
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleBan(u._id, u.isBanned)}
                              disabled={actionLoading === `ban-${u._id}`}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${u.isBanned ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}
                            >
                              {actionLoading === `ban-${u._id}`
                                ? <Loader2 size={12} className="animate-spin" />
                                : u.isBanned ? <><CheckCircle size={12} /> Unban</> : <><Ban size={12} /> Ban</>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ PILLAR 3: LIVE ORDERS ════════════════ */}
          {!loading && activeTab === 'orders' && (
            <div className="space-y-4 animate-[fadeInUp_0.4s_ease_forwards]">
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_STEPS).slice(0, 3).map(([key, v]) => (
                  <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${v.bg} ${v.color}`}>
                    {v.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                    {key}
                  </span>
                ))}
              </div>

              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60">
                  <Radio size={36} className="text-slate-300 mb-3" />
                  <p className="font-bold text-slate-500">No active orders on the radar</p>
                  <p className="text-sm text-slate-400">Campus is quiet right now</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {orders.map(order => {
                    const step = STATUS_STEPS[order.status] || STATUS_STEPS.PENDING;
                    return (
                      <div key={order._id} className={`bg-white/80 backdrop-blur-md rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${step.pulse ? 'border-blue-200/60' : 'border-slate-200/60'}`}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                              <Package size={16} className="text-slate-500" />
                            </div>
                            <div>
                              <p className="font-black text-slate-800 font-mono">#{shortId(order._id)}</p>
                              <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleTimeString('en-IN')}</p>
                            </div>
                          </div>
                          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${step.bg} ${step.color}`}>
                            {step.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                            {step.label}
                          </span>
                        </div>

                        <div className="px-5 py-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User size={13} className="text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700">{order.buyerId?.name ?? 'Unknown'}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500 text-xs">{order.buyerId?.phoneNumber ?? ''}</span>
                          </div>
                          {order.deliveryLocation && (
                            <div className="flex items-center gap-2 text-sm">
                              <Home size={13} className="text-slate-400 shrink-0" />
                              <span className="text-slate-600">{order.deliveryLocation}</span>
                            </div>
                          )}
                          {order.runnerId && (
                            <div className="flex items-center gap-2 text-sm mt-1 pt-2 border-t border-slate-50">
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">🏃 {order.runnerId.name}</span>
                              <span className="text-xs text-slate-400">{order.runnerId.phoneNumber}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2">
                            <div className="text-xs text-slate-500">
                              <span className="font-semibold text-slate-700">₹{order.pricing?.totalToPayAtDoor}</span> at door · Delivery ₹{order.pricing?.deliveryFee}
                            </div>
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              disabled={actionLoading === `cancel-${order._id}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                            >
                              {actionLoading === `cancel-${order._id}` ? <Loader2 size={12} className="animate-spin" /> : <><XCircle size={12} /> Cancel Order</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════ PILLAR 4: CANTEENS ════════════════ */}
          {!loading && activeTab === 'canteens' && (
            <div className="space-y-5 animate-[fadeInUp_0.4s_ease_forwards]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 font-medium">{canteens.length} canteens registered</p>
                <button onClick={() => setAddCanteenModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                  <Plus size={16} /> Add Canteen
                </button>
              </div>

              {canteens.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-52 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60">
                  <UtensilsCrossed size={36} className="text-slate-300 mb-3" />
                  <p className="font-bold text-slate-500">No canteens yet — add one above</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {canteens.map(c => (
                    <div key={c._id} className={`bg-white/80 backdrop-blur-md rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${c.isOpen ? 'border-emerald-200/60' : 'border-red-200/60'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0 mr-3">
                          <h3 className="font-black text-slate-800 text-base truncate">{c.name}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">{c.location}</p>
                          {c.packingFee > 0 && <p className="text-xs text-slate-400 mt-1">Packing ₹{c.packingFee}</p>}
                        </div>
                        <button
                          onClick={() => handleToggleCanteen(c._id, c.isOpen)}
                          disabled={actionLoading === `canteen-${c._id}`}
                          className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 ${c.isOpen ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}
                        >
                          {actionLoading === `canteen-${c._id}` ? <Loader2 size={18} className="animate-spin" /> : <Power size={18} />}
                        </button>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${c.isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        <span className={`w-2 h-2 rounded-full ${c.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                        {c.isOpen ? 'Accepting Orders' : 'Closed'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>


      {/* ════ ORDER HISTORY MODAL ════ */}
      {historyModal && (
        <Modal
          title={`Order History – ${historyModal.user.name}`}
          onClose={() => setHistoryModal(null)}
        >
          {historyLoading || !historyModal.data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Summary counts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-blue-600">{historyModal.data.totalOrdered}</p>
                  <p className="text-xs font-bold text-blue-500 mt-1 uppercase tracking-wide">Orders Placed</p>
                  <p className="text-xs text-slate-400 mt-0.5">as Buyer</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-emerald-600">{historyModal.data.totalDelivered}</p>
                  <p className="text-xs font-bold text-emerald-500 mt-1 uppercase tracking-wide">Deliveries Done</p>
                  <p className="text-xs text-slate-400 mt-0.5">as Runner</p>
                </div>
              </div>

              {/* Orders as Buyer */}
              {historyModal.data.ordersAsbuyer.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Orders Placed ({historyModal.data.ordersAsbuyer.length})
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {historyModal.data.ordersAsbuyer.map(o => (
                      <div key={o._id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                        <div>
                          <p className="text-xs font-black text-slate-700 font-mono">#{String(o._id).slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{o.itemDetails?.canteenName} · ₹{o.pricing?.totalToPayAtDoor}</p>
                          <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                          ${o.status === 'DELIVERED'  ? 'bg-emerald-50 text-emerald-600' :
                            o.status === 'CANCELLED'  ? 'bg-red-50 text-red-500'         :
                            o.status === 'PENDING'    ? 'bg-yellow-50 text-yellow-600'   : 'bg-blue-50 text-blue-600'}`}>
                          {o.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders as Runner */}
              {historyModal.data.ordersAsRunner.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Deliveries Completed ({historyModal.data.ordersAsRunner.length})
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {historyModal.data.ordersAsRunner.map(o => (
                      <div key={o._id} className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
                        <div>
                          <p className="text-xs font-black text-slate-700 font-mono">#{String(o._id).slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {o.itemDetails?.canteenName}
                            {o.buyerId?.name ? ` → ${o.buyerId.name}` : ''} · ₹{o.pricing?.deliveryFee} earned
                          </p>
                          <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          DELIVERED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {historyModal.data.totalOrdered === 0 && historyModal.data.totalDelivered === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">No orders yet for this user.</p>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* ════ COIN MODAL ════ */}
      {coinModal && (
        <Modal title={`Adjust UniCoins – ${coinModal.name}`} onClose={() => setCoinModal(null)}>

          <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <Coins size={20} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Current Balance</p>
                <p className="text-2xl font-black text-amber-600">{coinModal.balance} UC</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['add', 'deduct'].map(act => (
                <button key={act} onClick={() => setCoinAction(act)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all capitalize border ${coinAction === act ? act === 'add' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-red-500 text-white border-red-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >{act === 'add' ? '+ Add' : '− Deduct'}</button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Amount (UniCoins)</label>
              <input type="number" min="1" value={coinAmount} onChange={e => setCoinAmount(e.target.value)} placeholder="Enter amount…"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCoinModal(null)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-sm transition-colors">Cancel</button>
              <button onClick={handleAdjustCoins} disabled={!coinAmount || parseInt(coinAmount) <= 0 || actionLoading?.startsWith('coin-')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-50 ${coinAction === 'add' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {actionLoading?.startsWith('coin-') ? <Loader2 size={16} className="animate-spin mx-auto" /> : `Confirm ${coinAction === 'add' ? 'Add' : 'Deduct'}`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ════ ADD CANTEEN MODAL ════ */}
      {addCanteenModal && (
        <Modal title="Add New Canteen" onClose={() => setAddCanteenModal(false)}>
          <div className="space-y-5">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Canteen Details</h4>
              {[['name', 'Canteen Name *', 'text'], ['location', 'Location (e.g. Block 41) *', 'text'], ['packingFee', 'Packing Fee (₹)', 'number']].map(([field, ph, type]) => (
                <input key={field} type={type} placeholder={ph} value={newCanteen[field]} min={type === 'number' ? 0 : undefined}
                  onChange={e => setNewCanteen(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menu (Optional)</h4>
                <button onClick={addCategory} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold"><Plus size={13} /> Add Category</button>
              </div>
              {menuCategories.map((cat, ci) => (
                <div key={ci} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Category Name" value={cat.categoryName} onChange={e => updateCategory(ci, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    {menuCategories.length > 1 && <button onClick={() => removeCategory(ci)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>}
                  </div>
                  <div className="space-y-2">
                    {cat.items.map((item, ii) => (
                      <div key={ii} className="flex items-center gap-2">
                        <input type="text" placeholder="Item name" value={item.name} onChange={e => updateItem(ci, ii, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <input type="number" placeholder="₹" min="0" value={item.price} onChange={e => updateItem(ci, ii, 'price', e.target.value)}
                          className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                          <input type="checkbox" checked={item.isVeg} onChange={e => updateItem(ci, ii, 'isVeg', e.target.checked)} className="rounded" />Veg
                        </label>
                        {cat.items.length > 1 && <button onClick={() => removeItem(ci, ii)} className="text-red-400 hover:text-red-600"><X size={13} /></button>}
                      </div>
                    ))}
                    <button onClick={() => addItem(ci)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium"><Plus size={12} /> Add Item</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setAddCanteenModal(false)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-sm transition-colors">Cancel</button>
              <button onClick={handleCreateCanteen} disabled={canteenSubmitting || !newCanteen.name.trim() || !newCanteen.location.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                {canteenSubmitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Create Canteen'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default AdminDashboard;
