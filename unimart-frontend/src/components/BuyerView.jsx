import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, Plus, Minus, ArrowLeft, MapPin, Clock, Bike, CheckCircle, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { getCanteens, getActiveCustomerOrder, cancelOrder } from '../services/api';
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const BuyerView = ({ onLock }) => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // Modal & Loading States
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const checkIsCanteenOpen = (dbIsOpen) => {
    const currentHour = new Date().getHours(); // Gets the hour in 24h format (0-23)
    const isTimeValid = currentHour >= 9 || currentHour < 4;
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
  const activeStatuses = ['PENDING', 'ACCEPTED', 'PICKED_UP'];
  const activeOrder = (actualOrder && actualOrder.status && activeStatuses.includes(actualOrder.status)) ? actualOrder : null;

  const canteens = Array.isArray(canteensRes?.data) ? canteensRes.data : (Array.isArray(canteensRes) ? canteensRes : []);
  const loading = orderLoading || (!activeOrder && canteensLoading);

  // Auto Lock/Unlock Dashboard
  useEffect(() => {
    if (activeOrder) onLock && onLock(true);
    else onLock && onLock(false);
  }, [activeOrder, onLock]);

  // --- 2. SEAMLESS NAVIGATION ---
  const handleCanteenClick = (canteen) => {
    if (!canteen.isOpen) return;

    // Instantly navigate to the menu page and pass the basic info for the header
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
    return (
      <div className="max-w-3xl mx-auto animate-fade-in space-y-6 relative">

        {/*THE NEW CUSTOM CANCEL OVERLAY MODAL */}
        {showCancelModal &&
          createPortal(
            <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
              <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 p-6 animate-fade-in">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-50">
                    <AlertTriangle className="text-red-500" size={22} />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 text-center">Cancel Order</h2>
                <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <button onClick={executeCancelOrder} disabled={cancelLoading} className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {cancelLoading ? "Cancelling..." : "Cancel Order"}
                  </button>
                  <button onClick={() => setShowCancelModal(false)} disabled={cancelLoading} className="w-full py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition">
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
            PENDING: 'from-amber-500 to-orange-500',
            ACCEPTED: 'from-blue-500 to-indigo-600',
            PICKED_UP: 'from-emerald-500 to-teal-600',
            DELIVERED: 'from-purple-500 to-pink-500',
          }[s] || 'from-gray-700 to-gray-900';

          const heroMsg = {
            PENDING: { title: 'Looking for a Runner…', sub: 'Your order is live on the radar.' },
            ACCEPTED: { title: 'Runner is on the way!', sub: "They're heading to the canteen now." },
            PICKED_UP: { title: 'Food is in route! 🚀', sub: 'Your runner is heading to you.' },
            DELIVERED: { title: 'Enjoy your meal! 🎉', sub: "Hope it's delicious!" },
          }[s] || { title: 'Processing…', sub: '' };

          return (
            <div className={`rounded-3xl overflow-hidden shadow-2xl bg-linear-to-br ${heroBg}`}>
              <div className="relative h-44 flex items-center justify-center overflow-hidden">
                {s === 'PICKED_UP' && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden opacity-30">
                    <div className="h-full flex items-center gap-8 whitespace-nowrap" style={{ animation: 'roadScroll 1.2s linear infinite', width: '200%' }}>
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-16 h-2 bg-white rounded-full shrink-0" />
                      ))}
                    </div>
                  </div>
                )}
                <div className="absolute top-4 left-6 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-4 right-6 w-28 h-28 bg-black/10 rounded-full blur-2xl" />
                <div className="relative z-10 select-none" style={{ animation: s === 'PICKED_UP' ? 'riderBounce 0.5s ease-in-out infinite alternate' : s === 'PENDING' ? 'float 3s ease-in-out infinite' : 'none' }}>
                  <div className="text-[72px] leading-none drop-shadow-2xl">
                    {s === 'PENDING' && '🕐'}
                    {s === 'ACCEPTED' && '🏃'}
                    {s === 'PICKED_UP' && '🛵'}
                    {s === 'DELIVERED' && '🎉'}
                  </div>
                  {s === 'PICKED_UP' && <div className="absolute -inset-3 rounded-full border-4 border-white/30" style={{ animation: 'pulseGlow 1.5s ease-in-out infinite' }} />}
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center px-4">
                  <p className="text-white font-black text-lg drop-shadow-md leading-tight">{heroMsg.title}</p>
                  <p className="text-white/70 text-xs font-medium">{heroMsg.sub}</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm px-5 py-4">
                <div className="flex items-center">
                  {steps.map((step, i) => {
                    const done = i < stepIndex;
                    const current = i === stepIndex;
                    const future = i > stepIndex;
                    return (
                      <div key={step.label} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-black transition-all duration-500 border-2 ${done ? 'bg-white text-green-600 border-white shadow-lg' : ''} ${current ? 'bg-white border-white shadow-xl text-gray-900' : ''} ${future ? 'bg-white/10 border-white/30 text-white/40' : ''}`} style={current ? { animation: 'pulseGlow 2s ease-in-out infinite' } : done ? { animation: 'statusPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' } : {}}>
                            {done ? '✓' : step.emoji}
                          </div>
                          <span className={`text-[10px] font-bold tracking-tight text-center leading-tight max-w-13 ${done ? 'text-white' : current ? 'text-white font-black' : 'text-white/40'}`}>{step.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className="flex-1 h-0.5 mx-1 rounded-full bg-white/20 relative overflow-hidden mb-5">
                            <div className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-700" style={{ width: i < stepIndex ? '100%' : '0%' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center px-5 py-3 bg-black/20">
                <p className="text-white/70 text-xs font-semibold">From {activeOrder.itemDetails?.canteenName}</p>
                <div className="bg-white/20 border border-white/30 rounded-full px-4 py-1 text-white font-black text-sm">
                  ₹{activeOrder.pricing?.totalToPayAtDoor} to pay
                </div>
              </div>
            </div>
          );
        })()}

        {/* The Security PIN Card */}
        {activeOrder.status === 'PICKED_UP' && (
          <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <ShieldCheck className="absolute -right-6 -top-6 text-gray-700 opacity-30" size={120} />
            <h3 className="text-lg font-medium text-gray-300 mb-1 relative z-10">Delivery Security PIN</h3>
            <p className="text-sm text-gray-400 mb-4 relative z-10">Share this code with the Runner when they hand you the food.</p>
            <div className="text-5xl font-extrabold tracking-widest text-green-400 relative z-10">
              {activeOrder.deliveryPIN || "••••"}
            </div>
          </div>
        )}

        {/* Order Details Receipt */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><ShoppingBag size={18} /> Order Summary</h3>
          <div className="space-y-3 mb-4">
            {activeOrder.itemDetails?.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">{item.qty}x {item.name}</span>
                <span className="text-gray-900 font-bold">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
            {activeOrder.pricing?.packingFee > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Canteen Packing Charge</span>
                <span className="text-gray-900 font-bold">₹{activeOrder.pricing.packingFee}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery Fee</span>
              <span className="text-gray-900 font-bold">₹{activeOrder.pricing?.deliveryFee}</span>
            </div>
            <div className="flex justify-between text-base border-t border-dashed border-gray-100 pt-3 mt-1">
              <span className="font-bold text-gray-900">Total Amount</span>
              <span className="text-orange-600 font-black">₹{activeOrder.pricing?.totalToPayAtDoor}</span>
            </div>
          </div>
        </div>

        {/* ── Runner Contact Card ── */}
        {activeOrder.runnerId && (activeOrder.status === 'ACCEPTED' || activeOrder.status === 'PICKED_UP') && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                {activeOrder.runnerId.name?.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Your Runner</p>
                <p className="font-bold text-gray-900">{activeOrder.runnerId.name}</p>
              </div>
            </div>
            
            {/* 📞 Call Button */}
            {activeOrder.runnerId.phoneNumber && (
              <a
                href={`tel:${activeOrder.runnerId.phoneNumber}`}
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

        {/* Actions Container */}
        <div className="flex flex-col gap-2">
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['activeCustomerOrder'] })} className="w-full py-4 text-center text-gray-500 font-medium bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors">
            Refresh Status
          </button>
          {activeOrder.status !== 'PICKED_UP' && (
            <button onClick={() => setShowCancelModal(true)} className="w-full py-4 text-center text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors">
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
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {canteens.length === 0 ? (
        <div className="col-span-full text-center py-20 text-gray-500">No canteens available right now.</div>
      ) : (
        canteens.map((canteen) => {
          // 🛡️ THE FIX: Check the time right before rendering!
          const isActuallyOpen = checkIsCanteenOpen(canteen.isOpen);

          return (
            <div
              key={canteen._id}
              // Only allow clicks if it is ACTUALLY open
              onClick={() => isActuallyOpen && handleCanteenClick(canteen)}
              className={`bg-white rounded-2xl p-6 border border-gray-100 transition-all ${isActuallyOpen ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:border-orange-200' : 'opacity-60 grayscale cursor-not-allowed'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
                  <Store size={28} />
                </div>
                {/* Dynamically show OPEN or CLOSED */}
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${isActuallyOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {isActuallyOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{canteen.name}</h3>
              <p className="text-gray-500 text-sm flex items-center gap-1.5 font-medium">
                <MapPin size={14} className="text-gray-400" /> {canteen.location}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
};

export default BuyerView;