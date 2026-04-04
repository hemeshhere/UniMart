import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Ban, CheckCircle, ShieldAlert, Coins, XCircle, Power, Users } from 'lucide-react';

// Configure standard axios instance for admin
const adminApi = axios.create({
  baseURL: '/api/admin', // Assumes you have a proxy set up in vite.config.js
  withCredentials: true,
});

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  
  // Data States
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [canteens, setCanteens] = useState([]);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // Tracks which specific button is loading

  // Route the fetch based on the active tab
  useEffect(() => {
    fetchDataForTab(activeTab);
  }, [activeTab]);

  const fetchDataForTab = async (tab, forceRefresh = false) => {
    setLoading(true);
    try {
      if (tab === 'stats' && (!stats || forceRefresh)) {
        const res = await adminApi.get('/stats');
        setStats(res.data?.data || res.data || null);
        
      } else if (tab === 'orders' && (orders.length === 0 || forceRefresh)) {
        const res = await adminApi.get('/orders/live');
        // 🛡️ THE FIX: Only save it if it's an actual array, otherwise save []
        const fetchedData = res.data?.data || res.data;
        setOrders(Array.isArray(fetchedData) ? fetchedData : []); 
        
      } else if (tab === 'users' && (users.length === 0 || forceRefresh)) {
        const res = await adminApi.get('/users?limit=50');
        // 🛡️ THE FIX: Force Array
        const fetchedData = res.data?.data || res.data;
        setUsers(Array.isArray(fetchedData) ? fetchedData : []); 
        
      } else if (tab === 'canteens' && (canteens.length === 0 || forceRefresh)) {
        const res = await axios.get('/api/canteens', { withCredentials: true }); 
        // 🛡️ THE FIX: Force Array
        const fetchedData = res.data?.data || res.data?.canteens || res.data;
        setCanteens(Array.isArray(fetchedData) ? fetchedData : []);
      }
    } catch (error) {
      console.error(`Failed to load ${tab}`, error);
      // If the API completely fails, reset them to empty arrays so it doesn't crash!
      if (tab === 'orders') setOrders([]);
      if (tab === 'users') setUsers([]);
      if (tab === 'canteens') setCanteens([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ACTION HANDLERS (Optimistic Updates)
  // ==========================================

  const handleToggleBan = async (userId, currentStatus) => {
    setActionLoading(`ban-${userId}`);
    try {
      await adminApi.put(`/users/${userId}/ban`);
      // Optimistic Update: Flip the status in React without hitting the DB again
      setUsers(users.map(u => u._id === userId ? { ...u, isBanned: !currentStatus } : u));
    } catch (error) {
      alert("Failed to update ban status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdjustCoins = async (userId, action, amount = 10) => {
    setActionLoading(`coin-${userId}`);
    try {
      const res = await adminApi.put(`/users/${userId}/coins`, { action, amount });
      // Optimistic Update: Update their wallet in React instantly
      setUsers(users.map(u => u._id === userId ? { ...u, uniCoins: res.data.data.uniCoins } : u));
    } catch (error) {
      alert(error.response?.data?.error || "Failed to adjust coins");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to kill this order and refund?")) return;
    setActionLoading(`cancel-${orderId}`);
    try {
      await adminApi.put(`/orders/${orderId}/cancel`);
      // Optimistic Update: Remove from radar instantly
      setOrders(orders.filter(o => o._id !== orderId));
    } catch (error) {
      alert("Failed to cancel order");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleCanteen = async (canteenId, currentStatus) => {
    setActionLoading(`canteen-${canteenId}`);
    try {
      await adminApi.put(`/canteens/${canteenId}/toggle`);
      // Optimistic Update
      setCanteens(canteens.map(c => c._id === canteenId ? { ...c, isOpen: !currentStatus } : c));
    } catch (error) {
      alert("Failed to toggle canteen");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-950 p-6 flex flex-col gap-2 border-r border-gray-800 z-10">
        <div className="flex items-center gap-3 mb-8 px-2">
          <ShieldAlert className="text-orange-500" size={28} />
          <h1 className="text-xl font-black tracking-wider uppercase text-gray-100">HQ Command</h1>
        </div>
        
        {['stats', 'orders', 'users', 'canteens'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            {tab === 'stats' && '📊 Dashboard Stats'}
            {tab === 'orders' && '🛵 Live Radar'}
            {tab === 'users' && '👥 User Management'}
            {tab === 'canteens' && '🍔 Canteen Control'}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-10 overflow-y-auto bg-[#0a0f16]">
        
        {/* Header bar with Manual Refresh */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black uppercase tracking-tight text-gray-100">
            {activeTab.replace('-', ' ')}
          </h2>
          <button 
            onClick={() => fetchDataForTab(activeTab, true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg font-bold text-sm transition-all"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-orange-500' : ''} />
            Force Refresh
          </button>
        </div>

        {/* ============================== RENDER STATS ============================== */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={80} /></div>
              <h3 className="text-gray-400 font-bold tracking-widest text-xs uppercase mb-2">Total Students</h3>
              <p className="text-5xl font-black text-white">{stats.totalUsers}</p>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle size={80} /></div>
              <h3 className="text-gray-400 font-bold tracking-widest text-xs uppercase mb-2">Active Missions</h3>
              <p className="text-5xl font-black text-emerald-400">{stats.liveOrders}</p>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Coins size={80} /></div>
              <h3 className="text-gray-400 font-bold tracking-widest text-xs uppercase mb-2">System Liquidity</h3>
              <p className="text-5xl font-black text-yellow-400">{stats.totalCirculatingCoins} <span className="text-xl">UC</span></p>
            </div>
          </div>
        )}

        {/* ============================== RENDER ORDERS ============================== */}
        {activeTab === 'orders' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Safe check for length */}
             {Array.isArray(orders) && orders.length === 0 && !loading && (
               <p className="text-gray-500 font-bold">No active orders right now.</p>
             )}

             {/* Safe check before mapping */}
             {Array.isArray(orders) && orders.map(order => (
               <div key={order._id} className="bg-gray-800/80 p-5 rounded-2xl border border-gray-700 flex flex-col gap-3">
                 <div className="flex justify-between items-start">
                   <div>
                     <span className={`px-2 py-1 rounded text-xs font-black uppercase ${order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                       {order.status}
                     </span>
                     <p className="mt-2 text-sm font-bold text-gray-300">Buyer: {order.buyerId?.name} ({order.buyerId?.phoneNumber})</p>
                     <p className="text-sm font-bold text-gray-300">Drop: {order.buyerId?.hostel} - {order.buyerId?.roomNumber}</p>
                   </div>
                   <button 
                     onClick={() => handleCancelOrder(order._id)}
                     disabled={actionLoading === `cancel-${order._id}`}
                     className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition-colors"
                     title="Kill Order & Refund"
                   >
                     <XCircle size={20} />
                   </button>
                 </div>
                 {order.runnerId && (
                    <div className="mt-2 pt-3 border-t border-gray-700">
                      <p className="text-sm font-bold text-orange-400">🏃 Runner: {order.runnerId.name} ({order.runnerId.phoneNumber})</p>
                    </div>
                 )}
               </div>
             ))}
           </div>
        )}

        {/* ============================== RENDER USERS ============================== */}
        {activeTab === 'users' && (
           <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-900/80 text-gray-400 font-bold uppercase tracking-wider text-xs">
                 <tr>
                   <th className="p-4">Student</th>
                   <th className="p-4">Hostel</th>
                   <th className="p-4">UniCoins</th>
                   <th className="p-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-700">
                 {users.map(u => (
                   <tr key={u._id} className="hover:bg-gray-800/80 transition-colors">
                     <td className="p-4">
                       <p className="font-bold text-gray-200">{u.name}</p>
                       <p className="text-xs text-gray-500">{u.email} • {u.phoneNumber}</p>
                     </td>
                     <td className="p-4 font-medium text-gray-300">{u.hostel} {u.roomNumber}</td>
                     <td className="p-4">
                       <div className="flex items-center gap-2">
                         <span className="font-black text-yellow-500">{u.uniCoins}</span>
                         <button onClick={() => handleAdjustCoins(u._id, 'deduct', 10)} disabled={actionLoading === `coin-${u._id}`} className="text-gray-500 hover:text-red-400 bg-gray-900 px-2 py-0.5 rounded">-10</button>
                         <button onClick={() => handleAdjustCoins(u._id, 'add', 10)} disabled={actionLoading === `coin-${u._id}`} className="text-gray-500 hover:text-emerald-400 bg-gray-900 px-2 py-0.5 rounded">+10</button>
                       </div>
                     </td>
                     <td className="p-4 text-right">
                       <button 
                         onClick={() => handleToggleBan(u._id, u.isBanned)}
                         disabled={actionLoading === `ban-${u._id}`}
                         className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1 ml-auto ${
                           u.isBanned ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                         }`}
                       >
                         <Ban size={14} /> {u.isBanned ? 'Unban' : 'Ban'}
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {/* ============================== RENDER CANTEENS ============================== */}
        {activeTab === 'canteens' && (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {canteens.map(c => (
               <div key={c._id} className="bg-gray-800/80 p-6 rounded-2xl border border-gray-700 flex justify-between items-center">
                 <div>
                   <h3 className="font-black text-lg text-gray-100">{c.name}</h3>
                   <p className="text-sm font-bold mt-1">
                     Status: <span className={c.isOpen ? "text-emerald-400" : "text-red-500"}>{c.isOpen ? 'ACCEPTING ORDERS' : 'EMERGENCY STOP'}</span>
                   </p>
                 </div>
                 <button 
                   onClick={() => handleToggleCanteen(c._id, c.isOpen)}
                   disabled={actionLoading === `canteen-${c._id}`}
                   className={`p-4 rounded-full transition-all ${c.isOpen ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                 >
                   <Power size={24} />
                 </button>
               </div>
             ))}
           </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;