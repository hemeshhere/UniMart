import { useState, useEffect, useCallback , useContext} from 'react';
import { io } from "socket.io-client";
import { AuthContext } from '../context/AuthContext';
import {
  Zap, Package, MapPin, IndianRupee, Clock, CheckCircle,
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
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
            <Package size={16} className="text-orange-500" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Order</p>
            <p className="font-black text-gray-900 text-sm">#{shortId(order._id)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge color="orange">PENDING</Badge>
          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
            <Clock size={10} />
            {timeAgo(order.createdAt)}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-5 py-4 space-y-4 flex-1">
        
        {/* Pickup & Dropoff Timeline */}
        <div className="relative pl-3 space-y-4">
          {/* Vertical Dashed Line connecting Pickup and Dropoff */}
          <div className="absolute left-[23px] top-6 bottom-6 w-px border-l-2 border-dashed border-gray-200"></div>

          {/* Pickup — Canteen Name */}
          <div className="flex items-start gap-3 relative z-10">
            <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center shrink-0 shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pick up from</p>
              <p className="font-bold text-gray-900 text-[15px] leading-tight mt-0.5">
                {order.itemDetails?.canteenName || 'Campus Canteen'}
              </p>
            </div>
          </div>

          {/* Drop-off — 🆕 Now uses the beautifully formatted text string! */}
          <div className="flex items-start gap-3 relative z-10">
            <div className="mt-0.5 w-6 h-6 rounded-full bg-green-100 border-2 border-white flex items-center justify-center shrink-0 shadow-sm">
              <MapPin size={10} className="text-green-600" strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deliver to</p>
              <p className="font-black text-gray-900 text-[15px] leading-tight mt-0.5">
                {order.deliveryLocation || 'Student Location'}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Items — click to expand */}
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="w-full text-left flex items-start gap-3 group bg-white hover:bg-gray-50 p-3 -mx-2 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
        >
          {/* ICON */}
          <div className="mt-0.5 w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
            <Package size={14} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                {items.length} Item{items.length !== 1 ? 's' : ''}
              </p>

              <span
                className={`text-gray-400 group-hover:text-purple-500 transition-all duration-200 ${
                  expanded ? 'rotate-180' : ''
                }`}
              >
                ▾
              </span>
            </div>

            {/* COLLAPSED */}
            {!expanded && (
              <p className="text-sm font-medium text-gray-700 truncate group-hover:text-purple-700 transition-colors mt-1">
                {items
                  .map(i => `${i.qty}× ${i.name} • ₹${i.price}`)
                  .join('  |  ')}
              </p>
            )}

            {/* EXPANDED */}
            {expanded && (
              <ul className="mt-2 space-y-2">
                {items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 hover:bg-white hover:shadow-sm transition-all"
                  >
                    {/* LEFT */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.qty}×
                      </span>

                      <span className="text-gray-800 font-medium truncate">
                        {item.name}
                      </span>
                    </div>

                    {/* RIGHT */}
                    <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                      ₹{item.price}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </button>

      </div>

      {/* Payout & Accept Button Area */}
      <div className="px-5 pb-5 mt-auto">
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-t-xl px-4 py-3 mb-[-2px] relative z-0">
          <div className="flex items-center gap-1.5">
            <IndianRupee size={16} className="text-green-600" strokeWidth={3} />
            <span className="text-xs font-black uppercase tracking-widest text-green-700">Payout</span>
          </div>
          <span className="text-xl font-black text-green-700">₹{order.pricing?.deliveryFee ?? 20}</span>
        </div>

        <button
          id={`accept-btn-${order._id}`}
          onClick={() => onAccept(order._id)}
          disabled={isAccepting}
          className={`w-full py-4 rounded-b-xl rounded-t-none font-black text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 relative z-10
            ${isAccepting
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-900 hover:bg-black text-white active:scale-[0.98] shadow-lg shadow-gray-200'
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
  
  // 🎯 NEW: Mandatory Cancellation States
  const [showAbortModal, setShowAbortModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  const cancellationReasons = [
    "Item is out of stock",
    "Canteen is currently closed",
    "Buyer is not responding",
    "Personal emergency"
  ];

  const handleVerify = async () => {
    if (pin.length !== 4) return;
    setVerifyLoading(true);
    await onVerify(mission._id, pin);
    setVerifyLoading(false);
  };

  const confirmAbort = () => {
    if (!selectedReason) return;
    onAbort(mission._id, selectedReason);
    setShowAbortModal(false);
  };

  const statusSteps = ['ACCEPTED', 'PICKED_UP', 'DELIVERED'];
  const currentStep = statusSteps.indexOf(mission.status);

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-400 relative">

      {/* 🛑 THE MANDATORY CANCELLATION MODAL */}
      {showAbortModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 leading-tight">Abort Mission?</h3>
            </div>
            
            <p className="text-sm font-medium text-gray-500 mb-5 ml-13">
              Please select a reason so we can notify the buyer.
            </p>

            {/* Quick-Select Reason Chips */}
            <div className="space-y-2.5 mb-6">
              {cancellationReasons.map((reason, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-bold text-sm transition-all active:scale-[0.98] ${
                    selectedReason === reason 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => { setShowAbortModal(false); setSelectedReason(''); }}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={confirmAbort}
                disabled={!selectedReason || abortLoading}
                className="flex-1 py-3.5 rounded-xl font-black text-white bg-red-600 hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 flex justify-center items-center gap-2"
              >
                {abortLoading ? <Loader size={16} className="animate-spin" /> : 'Confirm Abort'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        
        <div className="text-sm text-gray-600 space-y-2.5 mt-1">
          <p className="flex items-start gap-2">
            <span className="font-bold text-gray-800 min-w-[70px]">Canteen:</span> 
            <span className="font-medium text-gray-900">{mission.itemDetails?.canteenName}</span>
          </p>

          <p className="flex items-start gap-2">
            <span className="font-bold text-gray-800 min-w-[70px]">Deliver to:</span> 
            <span className="font-black text-green-800 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
              {mission.deliveryLocation || 'Student Location'}
            </span>
          </p>

          <p className="flex items-start gap-2">
            <span className="font-bold text-gray-800 min-w-[70px]">Items:</span> 
            <span className="font-medium text-gray-900">
              {mission.itemDetails?.items?.map(i => `${i.qty}× ${i.name}`).join(', ')}
            </span>
          </p>

          <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
            <p className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Buyer pays at door:</span> 
              <span className="text-orange-600 font-black text-base">₹{mission.pricing?.totalToPayAtDoor}</span>
            </p>
            <p className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Your cut:</span> 
              <span className="text-green-600 font-black text-base">₹{mission.pricing?.deliveryFee}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Buyer Contact Card ── */}
      {mission.buyerId && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-black text-lg">
              {mission.buyerId.name?.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Delivery To</p>
              <p className="font-bold text-gray-900 leading-tight">{mission.buyerId.name}</p>
            </div>
          </div>
          
          {mission.buyerId.phoneNumber && (
            <a
              href={`tel:${mission.buyerId.phoneNumber}`}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-green-100"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Call
            </a>
          )}
        </div>
      )}

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

      {/* PIN Verify */}
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

      {/* 🎯 NEW: Abort Trigger Button */}
      {mission.status === 'ACCEPTED' && (
        <button
          onClick={() => setShowAbortModal(true)} // Opens the modal instead of firing API directly
          disabled={abortLoading}
          className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border border-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <XCircle size={16} />
          Abort Mission (refunds 5 coins)
        </button>
      )}
    </div>
  );
};

// ─── Main RunnerView ─────────────────────────────────────────────────────────

const RunnerView = ({ onLock }) => {
  const queryClient = useQueryClient();
  const { user, updateUser } = useContext(AuthContext);
  const [acceptingId, setAcceptingId] = useState(null);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [abortLoading, setAbortLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // React Query: Active Mission
  const { data: missionRes, isLoading: missionLoading } = useQuery({
    queryKey: ['activeRunnerMission'],
    queryFn: getActiveRunnerMission,
    retry: false
  });

  // React Query: Pending Radar Tasks (auto-polls every 15s)
  const { data: tasksRes, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['availableTasks'],
    queryFn: getAvailableTasks,
    refetchInterval: 15000,
  });

  // Derived State
  const activeMission = (missionRes?.hasActiveMission && missionRes?.data) ? missionRes.data : null;
  const pendingOrders = Array.isArray(tasksRes?.data) ? tasksRes.data : [];
  const fetchLoading = missionLoading || (tasksLoading && !tasksRes);

  // Socket LISTENER 
  useEffect(() => {
    // 1. Connect to the WebSocket
    const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(backendUrl);
    // 2. Join the Radar Room
    socket.emit('join_runners_room');
    // 3. Listen for New Orders
    socket.on('new_order_alert', (newOrder) => {
      console.log("NEW ORDER ON RADAR:", newOrder._id);
      
      // Instantly inject the new order into React Query's cache without refreshing!
      queryClient.setQueryData(['availableTasks'], (oldData) => {
        if (!oldData) return { data: [newOrder] };
        const oldTasks = Array.isArray(oldData.data) ? oldData.data : [];
        // Prevent duplicates
        if (oldTasks.some(o => o._id === newOrder._id)) return oldData;
        
        return { ...oldData, data: [newOrder, ...oldTasks] };
      });
    });

    // 4. Listen for Orders Taken by others / Cancelled by buyers
    socket.on('order_removed_from_radar', (orderId) => {
      console.log("ORDER REMOVED:", orderId);
      // Instantly remove the order from React Query's cache
      queryClient.setQueryData(['availableTasks'], (oldData) => {
        if (!oldData) return oldData;
        const oldTasks = Array.isArray(oldData.data) ? oldData.data : [];
        return { ...oldData, data: oldTasks.filter(o => o._id !== orderId) };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  useEffect(() => {
    if (activeMission) onLock && onLock(true);
    else onLock && onLock(false);
  }, [activeMission, onLock]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleAccept = async (orderId) => {
    setAcceptingId(orderId);
    try {
      await acceptOrderAsRunner(orderId);
      if (user) {
        updateUser({ uniCoins: user.uniCoins - 5 });
      }
      queryClient.invalidateQueries({ queryKey: ['activeRunnerMission'] });
      queryClient.invalidateQueries({ queryKey: ['availableTasks'] });
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
      queryClient.invalidateQueries({ queryKey: ['availableTasks'] });
    } finally {
      setAcceptingId(null);
    }
  };

  const handlePickedUp = async (orderId) => {
    setPickupLoading(true);
    try {
      await markPickedUp(orderId);
      queryClient.invalidateQueries({ queryKey: ['activeRunnerMission'] });
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
      queryClient.invalidateQueries({ queryKey: ['activeRunnerMission'] });
      queryClient.invalidateQueries({ queryKey: ['availableTasks'] });
      showToast('Delivery complete! Great work 🎉', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Incorrect PIN.', 'error');
    }
  };

  const handleAbort = async (orderId, reason) => {
    setAbortLoading(true);
    try {
      await abortMission(orderId, reason);
      if (user) {
        updateUser({ uniCoins: user.uniCoins + 5 });
      }
      queryClient.invalidateQueries({ queryKey: ['activeRunnerMission'] });
      queryClient.invalidateQueries({ queryKey: ['availableTasks'] });
      showToast('Mission aborted. 5 UniCoins refunded.', 'info');
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
              onClick={() => refetchTasks()}
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
