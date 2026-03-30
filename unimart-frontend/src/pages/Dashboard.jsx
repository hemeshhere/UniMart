import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Wallet, LogOut, ArrowRightLeft, Plus, CreditCard, CheckCircle, Sparkles, Lock, ShoppingBag, Bike } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BuyerView from '../components/BuyerView';
import RunnerView from '../components/RunnerView';
import { topUpWallet, getUserProfile, verifyRazorpayPayment, getActiveCustomerOrder, getActiveRunnerMission } from '../services/api';

const Dashboard = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeMode, setActiveMode] = useState('BUYER');
  const [toastMsg, setToastMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Wallet & UI States
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); 
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [addedAmount, setAddedAmount] = useState(0); 
  const [topUpAmount, setTopUpAmount] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);

  // SYNC WALLET BALANCE ON DASHBOARD LOAD
  useEffect(() => {
    if (!user) return; 

    const syncUserData = async () => {
      try {
        const res = await getUserProfile();
        const freshUserData = res.user || res.data || res;

        if (freshUserData && freshUserData.uniCoins !== undefined) {
          if (user.uniCoins !== freshUserData.uniCoins) {
            updateUser({ uniCoins: freshUserData.uniCoins }); 
          }
        }
      } catch (error) {
        console.warn("Could not sync fresh user data:", error);
      }
    };
    syncUserData();
  }, []); 

  // REACT QUERY FOR ACTIVE SESSIONS
  const { data: runnerRes, isLoading: runnerLoading } = useQuery({
    queryKey: ['activeRunnerMission'],
    queryFn: getActiveRunnerMission,
    retry: false
  });

  const { data: buyerRes, isLoading: buyerLoading } = useQuery({
    queryKey: ['activeCustomerOrder'],
    queryFn: getActiveCustomerOrder,
    retry: false
  });

  // SET DEFAULT MODE BASED ON LOADED QUERIES
  useEffect(() => {
    if (!runnerLoading && !buyerLoading && !initialCheckDone) {
      if (runnerRes?.hasActiveMission) {
        setActiveMode('RUNNER');
      } else {
        const order = Array.isArray(buyerRes?.data) ? buyerRes.data[0] : buyerRes?.data;
        const activeStatuses = ['PENDING', 'ACCEPTED', 'PICKED_UP'];
        if (order && order.status && activeStatuses.includes(order.status)) {
          setActiveMode('BUYER');
        }
      }
      setInitialCheckDone(true);
    }
  }, [runnerLoading, buyerLoading, runnerRes, buyerRes, initialCheckDone]);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMode = () => {
    if (isLocked) {
      setToastMsg('Please complete your active delivery or order first.');
      return;
    }
    if (activeMode === 'BUYER') {
      if (user?.uniCoins >= 10) {
        setActiveMode('RUNNER');
      } else {
        setShowAccessDeniedModal(true);
      }
    } else {
      setActiveMode('BUYER');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Top Up Logic
  const handleTopUp = async () => {
    setIsProcessing(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setIsProcessing(false);
        return alert("Razorpay SDK failed to load. Check your internet connection.");
      }

      const { order } = await topUpWallet(topUpAmount);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: order.amount, 
        currency: order.currency,
        name: "UniMart Campus",
        description: `${topUpAmount} UniCoins Top-up`,
        order_id: order.id,
        theme: { color: "#f97316" }, 

        handler: async function (response) {
          try {
            setToastMsg('Payment captured! Verifying securely...');

            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            updateUser({ uniCoins: verifyRes.uniCoins });
            
            setShowWalletModal(false);
            setAddedAmount(topUpAmount);
            setShowSuccessModal(true); 

          } catch (verificationError) {
            alert("Payment Verification Failed! If money was deducted, it will be refunded.");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      alert(error.message || error.response?.data?.message || "Failed to initialize payment.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 sm:pb-0 font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      
      {/* ── TOAST NOTIFICATION ── */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] bg-gray-900/95 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300">
          <Sparkles size={16} className="text-orange-400" />
          {toastMsg}
        </div>
      )}

      {/* ── 1. PREMIUM TOP-UP MODAL ── */}
      {showWalletModal && (
        <div className="fixed inset-0 w-screen h-screen bg-gray-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all">
          <div className="bg-white border border-gray-100 rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center border border-orange-100/50">
                  <Wallet size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-gray-900">Top Up Wallet</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Current: {user?.uniCoins || 0} Coins</p>
                </div>
              </div>
              <button onClick={() => setShowWalletModal(false)} className="bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-full p-2 transition-colors">✕</button>
            </div>
            
            <p className="text-sm text-gray-500 font-medium mb-4">Select an amount to recharge</p>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[20, 50, 100, 200, 500].map(amount => (
                <button
                  key={amount}
                  onClick={() => setTopUpAmount(amount)}
                  className={`relative py-4 rounded-2xl font-black text-lg transition-all duration-200 border-2 overflow-hidden group
                    ${topUpAmount === amount 
                    ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md shadow-orange-500/10 scale-[1.02]' 
                    : 'border-gray-100 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50/50'
                  }`}
                >
                  {topUpAmount === amount && <div className="absolute inset-0 bg-orange-500/10 animate-pulse"></div>}
                  <span className="relative z-10">₹{amount}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={handleTopUp} 
              disabled={isProcessing} 
              className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black text-lg rounded-2xl shadow-xl shadow-gray-900/20 disabled:opacity-70 flex justify-center items-center gap-2 transition-all active:scale-95"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Connecting...
                </span>
              ) : (
                <>Pay ₹{topUpAmount} Securely <ArrowRightLeft size={18} className="opacity-60" /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── 2. CELEBRATION MODAL ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 w-screen h-screen bg-gray-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50 to-transparent"></div>

            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-inner border-4 border-white">
              <CheckCircle className="text-green-500 w-12 h-12 animate-in zoom-in duration-500 delay-150" />
            </div>

            <h3 className="text-2xl font-black mb-2 tracking-tight text-gray-900 relative z-10">
              Payment Successful!
            </h3>
            
            <p className="text-gray-500 font-medium mb-8 relative z-10 leading-relaxed">
              You've securely added <br/>
              <span className="text-green-600 font-black text-3xl tracking-tight my-2 block">₹{addedAmount} UniCoins</span>
              to your campus wallet.
            </p>

            <button 
              onClick={() => setShowSuccessModal(false)} 
              className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black text-lg rounded-2xl shadow-xl shadow-gray-900/20 transition-all active:scale-95 relative z-10"
            >
              Awesome, let's go!
            </button>
          </div>
        </div>
      )}

      {/* ── 3. ACCESS DENIED MODAL ── */}
      {showAccessDeniedModal && (
        <div className="fixed inset-0 w-screen h-screen bg-gray-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 relative overflow-hidden border border-gray-100">

            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-50 rounded-full blur-3xl opacity-60"></div>

            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 relative z-10 border-4 border-white shadow-sm">
              <Lock className="text-red-500 w-8 h-8" strokeWidth={2.5} />
            </div>

            <h3 className="text-2xl font-black mb-2 tracking-tight text-gray-900">
              Unlock Runner Mode
            </h3>

            <p className="text-gray-500 font-medium mb-8 text-sm leading-relaxed px-2">
              You need a minimum balance of <span className="font-black text-gray-900">10 UniCoins</span> to become a Runner. This ensures secure and reliable deliveries.
            </p>

            <div className="w-full space-y-3 relative z-10">
              <button
                onClick={() => {
                  setShowAccessDeniedModal(false);
                  setShowWalletModal(true);
                }}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-base rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                <Wallet size={18} />
                Top Up Wallet
              </button>

              <button
                onClick={() => setShowAccessDeniedModal(false)}
                className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold text-base rounded-2xl transition-all active:scale-95"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE TOP HEADER ── */}
      <header className="sm:hidden bg-white/90 backdrop-blur-xl sticky top-0 z-40 border-b border-gray-100 px-5 py-3.5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[10px] flex items-center justify-center shadow-md shadow-orange-500/20">
            <span className="text-white font-black text-sm">U</span>
          </div>
          <span className="font-black tracking-tight text-lg text-gray-900">TheUniMart</span>
        </div>

        <button
          onClick={() => setShowWalletModal(true)}
          className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 py-1.5 px-3.5 rounded-full active:scale-95 transition-all shadow-sm"
        >
          <Wallet size={14} className="text-orange-500" />
          <span className="font-black text-gray-900">{user?.uniCoins || 0}</span>
        </button>
      </header>

      {/* ── DESKTOP NAVBAR ── */}
      <nav className="hidden sm:block bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <span className="text-white font-black text-2xl">U</span>
              </div>
              <span className="font-black text-2xl tracking-tight text-gray-900">TheUniMart</span>
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <p className="text-sm font-medium text-gray-500">Welcome back, <span className="text-gray-900 font-black">{user?.name?.split(' ')[0]}</span></p>
          </div>

          <div className="flex items-center gap-5">
            {/* Wallet Pill */}
            <div className="flex items-center bg-white p-1.5 rounded-full border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-orange-200">
              <div className="px-4 flex items-center gap-2.5">
                <Wallet size={18} className="text-orange-500" />
                <span className="font-black text-gray-900 text-lg leading-none mt-0.5">{user?.uniCoins || 0}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-0.5">Coins</span>
              </div>
              <button onClick={() => setShowWalletModal(true)} className="bg-gray-900 p-2.5 rounded-full text-white hover:bg-black transition-colors shadow-md active:scale-95">
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>

            {/* Switch Mode Button */}
            <button 
              onClick={toggleMode} 
              disabled={isLocked} 
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm transition-all active:scale-95
                ${isLocked ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : ''} 
                ${activeMode === 'BUYER' && !isLocked ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : ''}
                ${activeMode === 'RUNNER' && !isLocked ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50' : ''}
              `}
            >
              <ArrowRightLeft size={16} />
              {activeMode === 'BUYER' ? 'Switch to Runner' : 'Switch to Buyer'}
            </button>

            {/* Logout */}
            <button onClick={handleLogout} className="p-3 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all active:scale-95">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 z-40 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe">
        <button
          onClick={() => setActiveMode('BUYER')}
          className={`flex-1 flex flex-col items-center gap-1 transition-colors ${activeMode === 'BUYER' ? 'text-orange-500' : 'text-gray-400'}`}
        >
          <div className="p-2">
            <ShoppingBag size={22} strokeWidth={activeMode === 'BUYER' ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-black tracking-wider uppercase">Order</span>
        </button>

        {/* Floating Action Button for Switching */}
        <div className="relative -top-6 px-4">
          <button
            onClick={toggleMode}
            disabled={isLocked}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-white
              ${isLocked 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                : activeMode === 'BUYER'
                  ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/30 active:scale-95 hover:bg-black'
                  : 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 active:scale-95 hover:bg-blue-700'
              }`}
          >
            <ArrowRightLeft size={22} strokeWidth={2.5} />
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <div className="p-2">
            <LogOut size={22} />
          </div>
          <span className="text-[10px] font-black tracking-wider uppercase">Logout</span>
        </button>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        
        {/* Dynamic Header */}
        <div className="mb-8 animate-in slide-in-from-left-4 fade-in duration-500">
          <div className="flex items-center gap-3 mb-2">
            {activeMode === 'BUYER' ? (
              <div className="p-2.5 bg-orange-100 rounded-xl text-orange-600">
                <ShoppingBag size={24} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
                <Bike size={24} strokeWidth={2.5} />
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
              {activeMode === 'BUYER' ? 'Get Fed.' : 'Earn Coins.'}
            </h1>
          </div>
          <p className="text-gray-500 font-medium text-sm sm:text-base ml-1">
            {activeMode === 'BUYER' ? 'Order from your favorite campus spots directly to your location.' : 'Check the live radar for nearby delivery missions and earn.'}
          </p>
        </div>

        {/* View Container */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!initialCheckDone ? (
            <div className="flex flex-col justify-center items-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-gray-400 font-bold text-sm tracking-wide uppercase">Loading System...</p>
            </div>
          ) : activeMode === 'BUYER' ? (
            <BuyerView onLock={setIsLocked} />
          ) : (
            <RunnerView onLock={setIsLocked} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;