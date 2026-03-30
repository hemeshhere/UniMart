import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import { Store, ShoppingBag, Plus, Minus, ArrowLeft, MapPin, Clock, Bike, CheckCircle, ShieldCheck, UserCheck, AlertTriangle, XCircle, ChevronRight, Utensils } from 'lucide-react';
import { getCanteens, getActiveCustomerOrder, cancelOrder } from '../services/api';
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const BuyerView = ({ onLock }) => {
  const navigate = useNavigate();
  const shortId = (id = '') => id.slice(-6).toUpperCase();
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  // Modal & Loading States
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // ─── NEW: TOAST NOTIFICATION STATE & FUNCTION ───
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const checkIsCanteenOpen = (dbIsOpen) => {
    const currentHour = new Date().getHours(); 
    const isTimeValid = currentHour >= 9 && currentHour < 22;
    return dbIsOpen && isTimeValid;
  };

  // --- 1. THE GATEKEEPER: Caching with React Query ---
  const { data: orderRes, isLoading: orderLoading } = useQuery({
    queryKey: ['activeCustomerOrder'],
    queryFn: getActiveCustomerOrder,
    retry: false
  });

  const { data: canteensRes, isLoading: canteensLoading } = useQuery({
    queryKey: ['canteens'],
    queryFn: getCanteens,
  });

  // Derived State
  const actualOrder = Array.isArray(orderRes?.data) ? orderRes.data[0] : orderRes?.data;
  const activeStatuses = ['PENDING', 'ACCEPTED', 'PICKED_UP', 'CANCELLED'];
  const isDismissed = actualOrder ? localStorage.getItem(`dismissed_${actualOrder._id}`) === 'true' : false;
  const activeOrder = (actualOrder && actualOrder.status && activeStatuses.includes(actualOrder.status) && !isDismissed) ? actualOrder : null;

  const canteens = Array.isArray(canteensRes?.data) ? canteensRes.data : (Array.isArray(canteensRes) ? canteensRes : []);
  const loading = orderLoading || (!activeOrder && canteensLoading);

  // Auto Lock/Unlock Dashboard
  useEffect(() => {
    if (activeOrder) onLock && onLock(true);
    else onLock && onLock(false);
  }, [activeOrder, onLock]);

  // ─── NEW: REQUEST NATIVE NOTIFICATION PERMISSION ON LOAD ───
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ─── UPDATED: SECURE SOCKET LISTENER WITH NOTIFICATIONS ───
  useEffect(() => {
    if (!user?._id) return;
    const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = io(backendUrl);
    
    socket.emit('join_personal_room', user._id);
    
    socket.on('order_status_update', (updatedOrder) => {
      // 1. Instantly and silently fetch the SECURE, fully-populated order from the database
      queryClient.invalidateQueries({ queryKey: ['activeCustomerOrder'] });

      // 2. Set up the notification message
      let title = "Order Update!";
      let body = "Your order status has changed.";

      if (updatedOrder.status === 'ACCEPTED') {
        title = "Runner Assigned! 🏃";
        body = "A runner is heading to the canteen to pick up your food.";
      } else if (updatedOrder.status === 'PICKED_UP') {
        title = "Food is on the way! 🛵";
        body = "Get ready! Your runner has picked up your order.";
      } else if (updatedOrder.status === 'DELIVERED') {
        title = "Delivered! 🎉";
        body = "Enjoy your meal!";
      }

      // 3. Show In-App Notification Toast
      showToast(title);

      // 4. Show Browser/Phone Native Notification (if app is in background)
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body: body });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, user?._id]);

  // --- 2. SEAMLESS NAVIGATION ---
  const handleCanteenClick = (canteen) => {
    if (!canteen.isOpen) return;
    navigate(`/canteen/${canteen._id}`, {
      state: {
        canteenName: canteen.name,
        canteenLocation: canteen.location
      }
    });
  };

  // --- 3. Custom Overlay Cancel Logic ---
  const executeCancelOrder = async () => {
    setCancelLoading(true);
    try {
      await cancelOrder(activeOrder._id);
      queryClient.invalidateQueries({ queryKey: ['activeCustomerOrder'] });
      setShowCancelModal(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel the order. It might already be picked up!");
      setShowCancelModal(false);
    } finally {
      setCancelLoading(false);
    }
  };

  // ==========================================
  // VIEW 1: THE ACTIVE ORDER DASHBOARD (LOCKED)
  // ==========================================
  if (activeOrder) {
    if (activeOrder.status === 'CANCELLED') {
      return (
        <div className="max-w-md mx-auto animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[32px] border-2 border-red-100 shadow-2xl overflow-hidden">
            <div className="bg-red-500 p-8 flex flex-col items-center text-center text-white relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <XCircle size={120} />
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border-4 border-white/30">
                <AlertTriangle size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-black mb-1">Order Cancelled</h2>
              <p className="text-red-100 text-sm font-bold uppercase tracking-widest">#{shortId(activeOrder._id)}</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-2">
                  {activeOrder.cancellationReason ? "Runner Note" : "Order Status"}
                </p>
                <p className="text-gray-800 font-bold text-lg italic leading-tight">
                   "{activeOrder.cancellationReason || "You successfully cancelled this order."}"
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-500">
                  <Store size={18} className="shrink-0" />
                  <p className="text-sm font-medium">From <span className="text-gray-900 font-bold">{activeOrder.itemDetails?.canteenName}</span></p>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <ShoppingBag size={18} className="shrink-0" />
                  <p className="text-sm font-medium">Items: {activeOrder.itemDetails?.items?.map(i => i.name).join(', ')}</p>
                </div>
              </div>

              <button 
                onClick={async () => {
                   if (activeOrder?._id) {
                     localStorage.setItem(`dismissed_${activeOrder._id}`, 'true');
                   }
                   queryClient.setQueryData(['activeCustomerOrder'], (oldData) => {
                     return { ...oldData, data: null };
                   });
                   await queryClient.invalidateQueries({ queryKey: ['activeCustomerOrder'] });
                }}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl transition-all active:scale-95 shadow-xl shadow-gray-200"
              >
                Dismiss & Order Again
              </button>
            </div>
          </div>
          <p className="text-center mt-6 text-gray-400 text-xs font-bold px-10">
            Don't worry, no coins or money were deducted since the delivery was not completed.
          </p>
        </div>
      );
    }
    return (
      <div className="max-w-3xl mx-auto animate-fade-in space-y-6 relative">
        {/* ── HIGH-VISIBILITY IN-APP NOTIFICATION ── */}
        {toast && (
          <div className="fixed top-6 left-0 right-0 z-[99999] flex justify-center px-4 pointer-events-none">
            <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-orange-500/20 flex items-center gap-4 animate-in slide-in-from-top-10 fade-in duration-300 border-2 border-gray-800 max-w-sm w-full pointer-events-auto transform transition-all">
              {/* Pinging Dot Indicator */}
              <div className="relative flex items-center justify-center shrink-0 w-4 h-4">
                <div className="absolute w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              </div>
              <p className="font-black text-base tracking-wide leading-tight">{toast}</p>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal &&
          createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
              <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-50 border-4 border-white shadow-sm">
                    <AlertTriangle className="text-red-500" size={24} />
                  </div>
                </div>
                <h2 className="text-xl font-black text-gray-900 text-center">Cancel Order?</h2>
                <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed px-4">
                  Are you sure you want to cancel this order? This action cannot be undone once confirmed.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  <button onClick={executeCancelOrder} disabled={cancelLoading} className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-500/20">
                    {cancelLoading ? "Cancelling..." : "Yes, Cancel Order"}
                  </button>
                  <button onClick={() => setShowCancelModal(false)} disabled={cancelLoading} className="w-full py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold transition-all">
                    Keep Order
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        }

        {/* ── Animated Status Hero Card ── */}
        {(() => {
          const s = activeOrder.status;
          const stepIndex = { PENDING: 0, ACCEPTED: 1, PICKED_UP: 2, DELIVERED: 3 }[s] ?? 0;

          const steps = [
            { label: 'Pending', emoji: '🕐' },
            { label: 'Accepted', emoji: '👤' },
            { label: 'On the Way', emoji: '🛵' },
            { label: 'Delivered', emoji: '🎉' },
          ];

          const heroBg = {
            PENDING: 'from-amber-400 to-orange-500',
            ACCEPTED: 'from-blue-500 to-indigo-600',
            PICKED_UP: 'from-emerald-400 to-teal-600',
            DELIVERED: 'from-purple-500 to-pink-500',
          }[s] || 'from-gray-700 to-gray-900';

          const heroMsg = {
            PENDING: { title: 'Looking for a Runner…', sub: 'Your order is live on the radar.' },
            ACCEPTED: { title: 'Runner is on the way!', sub: "They're heading to the canteen now." },
            PICKED_UP: { title: 'Food is in route! 🚀', sub: 'Your runner is heading to you.' },
            DELIVERED: { title: 'Enjoy your meal! 🎉', sub: "Hope it's delicious!" },
          }[s] || { title: 'Processing…', sub: '' };

          return (
            <div className={`rounded-[32px] overflow-hidden shadow-2xl bg-gradient-to-br ${heroBg} transition-all duration-500`}>
              <div className="relative h-48 flex items-center justify-center overflow-hidden">
                {s === 'PICKED_UP' && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden opacity-30">
                    <div className="h-full flex items-center gap-8 whitespace-nowrap" style={{ animation: 'roadScroll 1.2s linear infinite', width: '200%' }}>
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-16 h-2 bg-white rounded-full shrink-0" />
                      ))}
                    </div>
                  </div>
                )}
                <div className="absolute top-4 left-6 w-24 h-24 bg-white/20 rounded-full blur-3xl" />
                <div className="absolute bottom-4 right-6 w-32 h-32 bg-black/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 select-none transform transition-transform hover:scale-110 duration-300" style={{ animation: s === 'PICKED_UP' ? 'riderBounce 0.5s ease-in-out infinite alternate' : s === 'PENDING' ? 'float 3s ease-in-out infinite' : 'none' }}>
                  <div className="text-[80px] leading-none drop-shadow-2xl">
                    {s === 'PENDING' && '🕐'}
                    {s === 'ACCEPTED' && '🏃'}
                    {s === 'PICKED_UP' && '🛵'}
                    {s === 'DELIVERED' && '🎉'}
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                  <p className="text-white font-black text-xl drop-shadow-md leading-tight">{heroMsg.title}</p>
                  <p className="text-white/80 text-sm font-medium mt-0.5">{heroMsg.sub}</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-6 py-5">
                <div className="flex items-center">
                  {steps.map((step, i) => {
                    const done = i < stepIndex;
                    const current = i === stepIndex;
                    const future = i > stepIndex;
                    return (
                      <div key={step.label} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black transition-all duration-500 border-2 ${done ? 'bg-white text-green-600 border-white shadow-lg scale-100' : ''} ${current ? 'bg-white border-white shadow-xl text-gray-900 scale-110' : ''} ${future ? 'bg-white/20 border-white/30 text-white/50 scale-90' : ''}`}>
                            {done ? '✓' : step.emoji}
                          </div>
                          <span className={`text-[11px] font-bold tracking-tight text-center leading-tight ${done ? 'text-white' : current ? 'text-white font-black' : 'text-white/50'}`}>{step.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className="flex-1 h-1 mx-2 rounded-full bg-white/20 relative overflow-hidden mb-6">
                            <div className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-700" style={{ width: i < stepIndex ? '100%' : '0%' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* The Security PIN Card */}
        {activeOrder.status === 'PICKED_UP' && (
          <div className="bg-gray-900 rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden border border-gray-800">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
            <ShieldCheck className="absolute -right-6 -top-6 text-gray-800 opacity-50" size={120} />
            <h3 className="text-lg font-bold text-gray-200 mb-1 relative z-10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Delivery Security PIN
            </h3>
            <p className="text-sm text-gray-400 mb-5 relative z-10">Share this code with your runner to complete the delivery.</p>
            <div className="text-6xl font-black tracking-[0.2em] text-green-400 relative z-10 drop-shadow-lg">
              {activeOrder.deliveryPIN || "••••"}
            </div>
          </div>
        )}

        {/* ── Beautiful Digital Receipt ── */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 relative overflow-hidden">
          <div className="h-2 w-full bg-orange-500 absolute top-0 left-0"></div>
          
          <div className="p-6">
            <h3 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-lg">
              <Utensils size={20} className="text-orange-500" /> 
              Order Summary
            </h3>
            
            <div className="space-y-4 mb-6">
              {activeOrder.itemDetails?.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm group">
                  <div className="flex items-center gap-3">
                    <span className="bg-orange-50 text-orange-600 font-bold px-2 py-1 rounded-md text-xs">{item.qty}x</span>
                    <span className="text-gray-800 font-semibold">{item.name}</span>
                  </div>
                  <span className="text-gray-900 font-bold">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-gray-200 my-4 relative">
              <div className="absolute -left-8 -top-3 w-6 h-6 bg-gray-50 rounded-full border border-gray-200"></div>
              <div className="absolute -right-8 -top-3 w-6 h-6 bg-gray-50 rounded-full border border-gray-200"></div>
            </div>

            <div className="flex flex-col gap-3">
              {activeOrder.pricing?.packingFee > 0 && (
                <div className="flex justify-between text-sm text-gray-500 font-medium">
                  <span>Packing Charge</span>
                  <span className="text-gray-900 font-bold">₹{activeOrder.pricing.packingFee}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-500 font-medium">
                <span>Delivery Fee</span>
                <span className="text-gray-900 font-bold">₹{activeOrder.pricing?.deliveryFee}</span>
              </div>
              
              <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100">
                <span className="font-black text-gray-900 text-lg">Total Amount</span>
                <span className="text-orange-600 font-black text-2xl">₹{activeOrder.pricing?.totalToPayAtDoor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Runner Contact Card ── */}
        {activeOrder.runnerId && (activeOrder.status === 'ACCEPTED' || activeOrder.status === 'PICKED_UP') && (
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-200 flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center text-orange-600 font-black text-xl shadow-inner">
                  {activeOrder.runnerId.name?.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-black uppercase tracking-wider mb-0.5">Your Runner</p>
                <p className="font-black text-gray-900 text-lg">{activeOrder.runnerId.name}</p>
              </div>
            </div>
            
            {activeOrder.runnerId.phoneNumber && (
              <a
                href={`tel:${activeOrder.runnerId.phoneNumber}`}
                className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-gray-200"
              >
                Call
              </a>
            )}
          </div>
        )}

        {/* Actions Container */}
        <div className="flex gap-3 pt-2">
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['activeCustomerOrder'] })} className="flex-1 py-4 text-center text-gray-600 font-bold bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 transition-colors active:scale-95 shadow-sm">
            Refresh
          </button>
          {activeOrder.status !== 'PICKED_UP' && (
            <button onClick={() => setShowCancelModal(true)} className="flex-1 py-4 text-center text-red-600 font-bold bg-white hover:bg-red-50 rounded-2xl border border-red-100 transition-colors active:scale-95 shadow-sm">
              Cancel Order
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: CANTEEN GRID (Loading & Display)
  // ==========================================

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-[24px] p-6 border border-gray-100 h-[160px] flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="w-32 h-5 bg-gray-200 rounded-md"></div>
                <div className="w-24 h-4 bg-gray-100 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">What are you craving?</h2>
          <p className="text-gray-500 font-medium text-sm mt-1">Select a canteen to start your order.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {canteens.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-[32px] border border-dashed border-gray-200">
            <Store size={48} className="mb-4 opacity-20" />
            <p className="font-bold text-lg">No canteens available right now.</p>
          </div>
        ) : (
          canteens.map((canteen) => {
            const isActuallyOpen = checkIsCanteenOpen(canteen.isOpen);

            return (
              <div
                key={canteen._id}
                onClick={() => isActuallyOpen && handleCanteenClick(canteen)}
                className={`group relative bg-white rounded-[24px] p-5 border-2 transition-all duration-300 overflow-hidden
                  ${isActuallyOpen 
                    ? 'border-transparent hover:border-orange-200 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer' 
                    : 'border-gray-100 opacity-60 grayscale cursor-not-allowed'}`}
              >
                {/* Subtle background glow on hover */}
                {isActuallyOpen && (
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className="bg-gray-50 group-hover:bg-orange-100 p-3.5 rounded-2xl text-gray-400 group-hover:text-orange-500 transition-colors duration-300 transform group-hover:scale-110">
                      <Store size={26} strokeWidth={2.5} />
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border backdrop-blur-md
                      ${isActuallyOpen 
                        ? 'bg-green-50/80 text-green-600 border-green-200/50 shadow-sm' 
                        : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {isActuallyOpen ? 'Open' : 'Closed'}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-gray-900 mb-1.5 truncate pr-8">{canteen.name}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-1.5 font-medium">
                    <MapPin size={14} className="text-gray-400" /> 
                    <span className="truncate">{canteen.location}</span>
                  </p>
                </div>

                {/* Sliding Arrow Indicator */}
                {isActuallyOpen && (
                  <div className="absolute bottom-6 right-5 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-orange-500">
                    <ChevronRight size={24} strokeWidth={3} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BuyerView;