import { useState, useEffect, useCallback } from 'react';
import {
  Zap, Package, MapPin, DollarSign, Clock, CheckCircle,
  AlertTriangle, RefreshCw, Bike, ShieldCheck, XCircle, Loader
} from 'lucide-react';
import {
  getAvailableTasks,
  acceptOrderAsRunner,
  getActiveRunnerMission,
  markPickedUp,
  verifyDeliveryPIN,
  abortMission
} from '../services/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

const shortId = (id = '') => id.slice(-6).toUpperCase();

const timeAgo = (isoDate) => {
  const diff = Math.floor((Date.now() - new Date(isoDate)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Small badge pill */
const Badge = ({ children, color = 'gray' }) => {
  const map = {
    orange: 'bg-orange-100 text-orange-700',
    green:  'bg-green-100 text-green-700',
    blue:   'bg-blue-100 text-blue-700',
    gray:   'bg-gray-100 text-gray-600',
    red:    'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${map[color]}`}>
      {children}
    </span>
  );
};

/** Toast notification (auto-dismiss handled by parent) */
const Toast = ({ message, type = 'info' }) => {
  const styles = {
    info:    'bg-gray-900 text-white',
    success: 'bg-green-600 text-white',
    error:   'bg-red-600 text-white',
  };
  return (
    <div className={`fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 animate-bounce-in ${styles[type]}`}>
      {type === 'error' && <AlertTriangle size={16} />}
      {type === 'success' && <CheckCircle size={16} />}
      {message}
    </div>
  );
};

// ─── Pending Order Card ──────────────────────────────────────────────────────

const PendingOrderCard = ({ order, onAccept, isAccepting }) => {
  const [expanded, setExpanded] = useState(false);
  const items = order.itemDetails?.items || [];

  const [lat, lng] = order.dropoffLocation?.coordinates
    ? [order.dropoffLocation.coordinates[1].toFixed(4), order.dropoffLocation.coordinates[0].toFixed(4)]
    : ['—', '—'];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
            <Package size={16} className="text-orange-500" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Order</p>
            <p className="font-black text-gray-900 text-sm">#{shortId(order._id)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="orange">PENDING</Badge>
          <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
            <Clock size={11} />
            {timeAgo(order.createdAt)}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Pickup — Canteen Name */}
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <MapPin size={13} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pick up from</p>
            <p className="font-bold text-gray-800 text-sm">{order.itemDetails?.canteenName || 'Campus Canteen'}</p>
          </div>
        </div>

        {/* Drop-off */}
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <MapPin size={13} className="text-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Drop off at</p>
            <p className="font-mono text-gray-700 text-xs">{lat}°N, {lng}°E</p>
          </div>
        </div>

        {/* Items — click to expand */}
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="w-full text-left flex items-start gap-2.5 group"
        >
          <div className="mt-0.5 w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <Package size={13} className="text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              {items.length} Item{items.length !== 1 ? 's' : ''}
              <span className={`ml-1 text-purple-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </p>

            {/* Collapsed: one-line summary */}
            {!expanded && (
              <p className="text-sm text-gray-700 truncate group-hover:text-purple-600 transition-colors">
                {items.map(i => `${i.qty}× ${i.name}`).join(', ')}
              </p>
            )}

            {/* Expanded: each item on its own row */}
            {expanded && (
              <ul className="mt-1.5 space-y-1.5">
                {items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                    <span className="flex items-center gap-2 text-gray-800 font-medium">
                      <span className="bg-purple-100 text-purple-700 text-[11px] font-black px-1.5 py-0.5 rounded">
                        {item.qty}×
                      </span>
                      {item.name}
                    </span>
                    <span className="font-black text-gray-700 text-xs">₹{(item.price * item.qty).toFixed(0)}</span>
                  </li>
                ))}
                {/* Subtotal row */}
                <li className="flex items-center justify-between text-sm px-3 pt-1 border-t border-gray-200 mt-1">
                  <span className="text-gray-500 font-medium">Items subtotal</span>
                  <span className="font-black text-gray-900">
                    ₹{items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(0)}
                  </span>
                </li>
              </ul>
            )}
          </div>
        </button>

        {/* Payout */}
        <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <DollarSign size={15} className="text-green-600" />
            <span className="text-sm font-bold text-green-700">Your Payout</span>
          </div>
          <span className="text-lg font-black text-green-700">₹{order.pricing?.deliveryFee ?? 20}</span>
        </div>
      </div>

      {/* Accept Button */}
      <div className="px-5 pb-5">
        <button
          id={`accept-btn-${order._id}`}
          onClick={() => onAccept(order._id)}
          disabled={isAccepting}
          className={`w-full py-3.5 rounded-xl font-black text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2
            ${isAccepting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 hover:bg-black text-white active:scale-95 shadow-lg shadow-gray-200'
            }`}
        >
          {isAccepting ? (
            <>
              <Loader size={16} className="animate-spin" />
              Securing Mission…
            </>
          ) : (
            <>
              <Zap size={16} className="text-yellow-400" />
              Accept Order
            </>
          )}
        </button>
      </div>
    </div>
  );
};


// ─── Active Mission Card ─────────────────────────────────────────────────────

const ActiveMissionCard = ({ mission, onPickedUp, onVerify, onAbort, pickupLoading, abortLoading }) => {
  const [pin, setPin] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleVerify = async () => {
    if (pin.length !== 4) return;
    setVerifyLoading(true);
    await onVerify(mission._id, pin);
    setVerifyLoading(false);
  };

  const statusSteps = ['ACCEPTED', 'PICKED_UP', 'DELIVERED'];
  const currentStep = statusSteps.indexOf(mission.status);

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-400">

      {/* Status Banner */}
      <div className="bg-linear-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white relative overflow-hidden">
        <Bike className="absolute -right-4 -top-4 text-gray-700 opacity-20" size={100} />
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Active Mission</p>
        <h2 className="text-2xl font-black mb-3">
          {mission.status === 'ACCEPTED' ? '🛒 Go collect the order' : '🚴 Deliver to the buyer'}
        </h2>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {['Accepted', 'Picked Up', 'Delivered'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                i <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {i < currentStep && <CheckCircle size={11} />}
                {label}
              </div>
              {i < 2 && <div className={`h-px w-4 ${i < currentStep ? 'bg-green-400' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Mission Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-black text-gray-900 text-sm uppercase tracking-wide flex items-center gap-2">
          <Package size={15} className="text-orange-500" />
          Mission Details — #{shortId(mission._id)}
        </h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><span className="font-bold text-gray-800">Canteen:</span> {mission.itemDetails?.canteenName}</p>
          <p><span className="font-bold text-gray-800">Items:</span> {mission.itemDetails?.items?.map(i => `${i.qty}× ${i.name}`).join(', ')}</p>
          <p><span className="font-bold text-gray-800">Buyer pays at door:</span> <span className="text-orange-600 font-black">₹{mission.pricing?.totalToPayAtDoor}</span></p>
          <p><span className="font-bold text-gray-800">Your cut:</span> <span className="text-green-600 font-black">₹{mission.pricing?.deliveryFee}</span></p>
          {mission.buyerId?.name && <p><span className="font-bold text-gray-800">Buyer:</span> {mission.buyerId.name}</p>}
        </div>
      </div>

      {/* Action Buttons */}
      {mission.status === 'ACCEPTED' && (
        <button
          onClick={() => onPickedUp(mission._id)}
          disabled={pickupLoading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100"
        >
          {pickupLoading ? <Loader size={18} className="animate-spin" /> : <Bike size={18} />}
          {pickupLoading ? 'Updating…' : 'Mark as Picked Up'}
        </button>
      )}

      {/* PIN Verify — only once food has been collected */}
      {mission.status === 'PICKED_UP' && (

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-green-500" />
            <h3 className="font-black text-gray-900 text-sm">Enter Delivery PIN</h3>
          </div>
          <p className="text-xs text-gray-500">Ask the buyer for their 4-digit PIN to complete the delivery.</p>
          <div className="flex flex-col gap-3">
            <input
              type="number"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.slice(0, 4))}
              placeholder="• • • •"
              className="w-full border-2 border-gray-200 focus:border-gray-900 outline-none rounded-xl text-center text-xl font-black tracking-[0.5em] py-3 transition-colors"
            />
            <button
              onClick={handleVerify}
              disabled={pin.length !== 4 || verifyLoading}
              className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {verifyLoading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {verifyLoading ? 'Verifying…' : 'Verify Delivery'}
            </button>
          </div>

        </div>
      )}

      {/* Abort */}
      {mission.status === 'ACCEPTED' && (
        <button
          onClick={() => onAbort(mission._id)}
          disabled={abortLoading}
          className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border border-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {abortLoading ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
          {abortLoading ? 'Aborting…' : 'Abort Mission (refunds 5 coins)'}
        </button>
      )}
    </div>
  );
};

// ─── Main RunnerView ─────────────────────────────────────────────────────────

const RunnerView = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeMission, setActiveMission] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [abortLoading, setAbortLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch available tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await getAvailableTasks();
      const tasks = Array.isArray(res.data) ? res.data : [];
      setPendingOrders(tasks);
    } catch (err) {
      // Silently fail on background refresh
    }
  }, []);

  // On mount: check for existing active mission, then load pending orders
  useEffect(() => {
    const init = async () => {
      setFetchLoading(true);
      try {
        const missionRes = await getActiveRunnerMission();
        if (missionRes.hasActiveMission && missionRes.data) {
          setActiveMission(missionRes.data);
          setFetchLoading(false);
          return; // No need to load radar if already on a mission
        }
      } catch (err) {
        // No active mission, proceed
      }
      await fetchTasks();
      setFetchLoading(false);
    };
    init();
  }, [fetchTasks]);

  // Auto-refresh every 15s when not on an active mission
  useEffect(() => {
    if (activeMission) return;
    const interval = setInterval(fetchTasks, 15000);
    return () => clearInterval(interval);
  }, [activeMission, fetchTasks]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleAccept = async (orderId) => {
    setAcceptingId(orderId);
    try {
      const res = await acceptOrderAsRunner(orderId);
      setActiveMission(res.data);
      showToast('Mission secured! 5 UniCoins deducted.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to accept order.';
      if (err.response?.status === 409) {
        showToast('Too late! Another runner grabbed it.', 'error');
      } else if (err.response?.status === 403) {
        showToast('Insufficient UniCoins. Please top up.', 'error');
      } else {
        showToast(msg, 'error');
      }
      // Refresh list to remove the order if it was taken
      fetchTasks();
    } finally {
      setAcceptingId(null);
    }
  };

  const handlePickedUp = async (orderId) => {
    setPickupLoading(true);
    try {
      const res = await markPickedUp(orderId);
      setActiveMission(res.data);
      showToast('Food collected! Head to the drop-off point.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setPickupLoading(false);
    }
  };

  const handleVerify = async (orderId, pin) => {
    try {
      await verifyDeliveryPIN(orderId, pin);
      setActiveMission(null);
      showToast('Delivery complete! Great work 🎉', 'success');
      fetchTasks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Incorrect PIN.', 'error');
    }
  };

  const handleAbort = async (orderId) => {
    setAbortLoading(true);
    try {
      await abortMission(orderId);
      setActiveMission(null);
      showToast('Mission aborted. 5 UniCoins refunded.', 'info');
      fetchTasks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not abort mission.', 'error');
    } finally {
      setAbortLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Loading State */}
      {fetchLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Scanning the radar…</p>
        </div>
      )}

      {/* Active Mission */}
      {!fetchLoading && activeMission && (
        <ActiveMissionCard
          mission={activeMission}
          onPickedUp={handlePickedUp}
          onVerify={handleVerify}
          onAbort={handleAbort}
          pickupLoading={pickupLoading}
          abortLoading={abortLoading}
        />
      )}

      {/* Pending Orders Radar */}
      {!fetchLoading && !activeMission && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Zap size={20} className="text-orange-500" />
                Live Radar
                <span className="ml-1 bg-orange-100 text-orange-600 text-xs font-black px-2 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">Auto-refreshes every 15 seconds</p>
            </div>
            <button
              onClick={fetchTasks}
              className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-400 px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {/* Orders Grid or Empty State */}
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                <Bike size={32} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="font-black text-gray-800 text-lg">No missions nearby</p>
                <p className="text-gray-400 text-sm mt-1">New orders will appear here automatically.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOrders.map(order => (
                <PendingOrderCard
                  key={order._id}
                  order={order}
                  onAccept={handleAccept}
                  isAccepting={acceptingId === order._id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RunnerView;
