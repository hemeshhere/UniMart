import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Wallet, LogOut, ArrowRightLeft, Plus, CreditCard, CheckCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BuyerView from '../components/BuyerView';
import RunnerView from '../components/RunnerView';
import { topUpWallet, getUserProfile, verifyRazorpayPayment } from '../services/api';

const Dashboard = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeMode, setActiveMode] = useState('BUYER');
  const [toastMsg, setToastMsg] = useState('');

  // Wallet & UI States
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); 
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
    if (activeMode === 'BUYER') {
      if (user?.uniCoins >= 10) {
        setActiveMode('RUNNER');
      } else {
        setToastMsg('Access Denied: You need at least 10 UniCoins to become a Runner.');
        setShowWalletModal(true); 
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
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0 font-sans text-gray-900">
      
      {/* 🛑 1. LIGHTWEIGHT TOP-UP MODAL 🛑 */}
      {showWalletModal && (
        <div className="fixed inset-0 w-screen h-screen bg-gray-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all">
          <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-gray-900/10 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
                <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                  <Wallet size={20} />
                </div>
                Top Up Balance
              </h3>
              <button onClick={() => setShowWalletModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1">✕</button>
            </div>
            
            <p className="text-sm text-gray-500 font-medium mb-5">Select amount to add to your wallet</p>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[20, 50, 100, 200, 500].map(amount => (
                <button
                  key={amount}
                  onClick={() => setTopUpAmount(amount)}
                  className={`py-3 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                    topUpAmount === amount 
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:scale-[1.02]'
                  }`}
                >
                  ₹{amount}
                </button>
              ))}
            </div>

            <button 
              onClick={handleTopUp} 
              disabled={isProcessing} 
              className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-semibold text-lg rounded-2xl shadow-md shadow-gray-900/10 disabled:opacity-70 flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <span className="animate-pulse">Connecting to Bank...</span>
              ) : (
                <>Pay ₹{topUpAmount} <ArrowRightLeft size={18} className="opacity-60" /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 🛑 2. LIGHTWEIGHT SUCCESS CELEBRATION MODAL 🛑 */}
      {showSuccessModal && (
        <div className="fixed inset-0 w-screen h-screen bg-gray-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-gray-900/10 flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <CheckCircle className="text-green-500 w-10 h-10 animate-in zoom-in duration-500 delay-150" />
            </div>

            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 tracking-tight">
              Payment Successful
            </h3>
            
            <p className="text-gray-500 font-medium mb-8">
              You've securely added <br/>
              <span className="text-gray-900 font-bold text-2xl tracking-tight">₹{addedAmount} UniCoins</span> <br/>
              to your campus wallet.
            </p>

            <button 
              onClick={() => setShowSuccessModal(false)} 
              className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-semibold text-lg rounded-2xl shadow-md transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* --- MOBILE TOP HEADER --- */}
      <header className="sm:hidden bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm shadow-orange-200">
            <span className="text-white font-black text-xs">U</span>
          </div>
          <span className="font-bold tracking-tight">UniMart</span>
        </div>

        <button
          onClick={() => setShowWalletModal(true)}
          className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 py-1.5 px-3 rounded-full active:scale-95 transition-all"
        >
          <Wallet size={14} className="text-gray-600" />
          <span className="font-bold text-gray-800 text-sm">{user?.uniCoins || 0}</span>
          <Plus size={12} className="text-gray-500" />
        </button>
      </header>

      {/* --- DESKTOP NAVBAR (Hidden on Mobile) --- */}
      <nav className="hidden sm:block bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm shadow-orange-200">
                <span className="text-white font-black text-xl">U</span>
              </div>
              <span className="font-bold text-2xl tracking-tight">UniMart</span>
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <p className="text-sm font-medium text-gray-500">Welcome, <span className="text-gray-900 font-bold">{user?.name?.split(' ')[0]}</span></p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-200 transition-all hover:bg-white hover:shadow-sm">
              <div className="px-4 flex items-center gap-2">
                <Wallet size={18} className="text-gray-600" />
                <span className="font-bold text-gray-900">{user?.uniCoins || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Coins</span>
              </div>
              <button onClick={() => setShowWalletModal(true)} className="bg-gray-900 p-2 rounded-xl text-white hover:bg-black transition-colors shadow-sm">
                <Plus size={18} />
              </button>
            </div>

            <button onClick={toggleMode} className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeMode === 'BUYER' ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}>
              {activeMode === 'BUYER' ? 'Switch to Runner' : 'Switch to Buyer'}
            </button>

            <button onClick={handleLogout} className="p-2.5 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-40 flex justify-around items-center">
        <button
          onClick={() => setActiveMode('BUYER')}
          className={`flex flex-col items-center gap-1 ${activeMode === 'BUYER' ? 'text-gray-900' : 'text-gray-400'}`}
        >
          <div className={`p-2 rounded-xl transition-colors ${activeMode === 'BUYER' ? 'bg-gray-100' : ''}`}>
            <CreditCard size={20} />
          </div>
          <span className="text-[10px] font-semibold tracking-wide">Orders</span>
        </button>

        <button
          onClick={toggleMode}
          className="relative -top-6 w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-gray-900/20 active:scale-95 transition-transform"
        >
          <ArrowRightLeft size={20} />
        </button>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900"
        >
          <div className="p-2">
            <LogOut size={20} />
          </div>
          <span className="text-[10px] font-semibold tracking-wide">Logout</span>
        </button>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        {toastMsg && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] bg-gray-900 text-white px-5 py-2.5 rounded-full shadow-lg font-semibold text-sm animate-in slide-in-from-top-4 fade-in duration-200">
            {toastMsg}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            {activeMode === 'BUYER' ? 'Get Fed.' : 'Earn Coins.'}
          </h1>
          <p className="text-gray-500 font-medium text-sm sm:text-base">
            {activeMode === 'BUYER' ? 'Order from your favorite campus spots.' : 'Check the radar for nearby missions.'}
          </p>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {activeMode === 'BUYER' ? <BuyerView /> : <RunnerView />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;