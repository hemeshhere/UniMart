import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Wallet, LogOut, ArrowRightLeft, AlertCircle, Plus, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BuyerView from '../components/BuyerView';
import { topUpWallet, getUserProfile, verifyRazorpayPayment } from '../services/api';
const RunnerView = () => (
  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
    <h2 className="text-2xl font-bold text-gray-800">Runner Mode Active</h2>
    <p className="text-gray-500">Live Radar coming soon...</p>
  </div>
);

const Dashboard = () => {
  // 🛡️ Import updateUser here!
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeMode, setActiveMode] = useState('BUYER'); 
  const [toastMsg, setToastMsg] = useState('');
  
  // Wallet States
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);

  // SYNC WALLET BALANCE ON DASHBOARD LOAD
  useEffect(() => {
    const syncUserData = async () => {
      try {
        const res = await getUserProfile();
        // Check if backend wraps user in 'data' or 'user' property
        const freshUserData = res.user || res.data || res; 
        
        if (freshUserData && freshUserData.uniCoins !== undefined) {
          updateUser({ uniCoins: freshUserData.uniCoins }); // Instantly updates the UI!
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
        setShowWalletModal(true); // Automatically show modal if they fail the check!
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
      // 1. Load the Razorpay UI Script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Razorpay SDK failed to load. Check your internet connection.");

      // 2. Create the Order on the Backend
      const { order } = await topUpWallet(topUpAmount);

      // 3. Initialize Razorpay Checkout Options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Your Public Key
        amount: order.amount, // Amount is in paise
        currency: order.currency,
        name: "UniMart Campus",
        description: `${topUpAmount} UniCoins Top-up`,
        order_id: order.id, 
        theme: { color: "#f97316" }, // Matches your Tailwind orange-500
        
        // 4. Handle Success
        handler: async function (response) {
          try {
            setToastMsg('Payment captured! Verifying securely...');
            
            // 5. Send data to backend vault for Cryptographic Verification
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amountAdded: topUpAmount // Tell backend how much to add
            });

            // 6. If verified, update the UI instantly with the true database value
            updateUser({ uniCoins: verifyRes.uniCoins });
            setShowWalletModal(false);
            setToastMsg(`Successfully added ${topUpAmount} UniCoins!`);
            
          } catch (verificationError) {
            alert("Payment Verification Failed! If money was deducted, it will be refunded.");
          }
        },
        // 7. Handle Modal Close / Failure
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      // 8. Open the Razorpay Popup
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      alert(error.message || error.response?.data?.message || "Failed to initialize payment.");
      setIsProcessing(false);
    }
  };

  return (
  <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
    {/* 🛑 MODALS & TOASTS (Always top level) 🛑 */}
    {showWalletModal && (
      /* Using z-[9999] and w-screen/h-screen as discussed for total lockdown */
      <div className="fixed inset-0 w-screen h-screen bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
           {/* Modal content remains same as previous step */}
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Wallet className="text-orange-500" /> Top Up
              </h3>
              <button onClick={() => setShowWalletModal(false)} className="text-gray-400 p-2">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[20, 50, 100, 200, 500].map(amount => (
                <button 
                  key={amount}
                  onClick={() => setTopUpAmount(amount)}
                  className={`py-3 rounded-2xl font-bold border-2 transition-all ${
                    topUpAmount === amount ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
            <button onClick={handleTopUp} disabled={isProcessing} className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl disabled:opacity-50">
               {isProcessing ? 'Processing...' : `Pay ₹${topUpAmount}`}
            </button>
        </div>
      </div>
    )}

    {/* --- MOBILE TOP HEADER --- */}
    <header className="sm:hidden bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
          <span className="text-white font-black text-xs">U</span>
        </div>
        <span className="font-black text-gray-900 tracking-tight">UniMart</span>
      </div>

      <button 
        onClick={() => setShowWalletModal(true)}
        className="flex items-center gap-2 bg-orange-50 border border-orange-100 py-1.5 px-3 rounded-full active:scale-95 transition-transform"
      >
        <Wallet size={14} className="text-orange-600" />
        <span className="font-black text-orange-700 text-sm">{user?.uniCoins || 0}</span>
        <Plus size={12} className="text-white bg-orange-500 rounded-full" />
      </button>
    </header>

    {/* --- DESKTOP NAVBAR (Hidden on Mobile) --- */}
    <nav className="hidden sm:block bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-100">
               <span className="text-white font-black text-xl">U</span>
            </div>
            <span className="font-black text-2xl tracking-tighter text-gray-900">UniMart</span>
          </div>
          <div className="h-8 w-px bg-gray-100"></div>
          <p className="text-sm font-bold text-gray-500">Welcome, <span className="text-gray-900">{user?.name?.split(' ')[0]}</span></p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
             <div className="px-4 flex items-center gap-2">
               <Wallet size={18} className="text-orange-500" />
               <span className="font-black text-gray-900">{user?.uniCoins || 0}</span>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Coins</span>
             </div>
             <button onClick={() => setShowWalletModal(true)} className="bg-orange-500 p-2 rounded-xl text-white hover:bg-orange-600 transition-colors">
               <Plus size={18} />
             </button>
          </div>
          
          <button onClick={toggleMode} className={`px-6 py-3 rounded-2xl font-black text-sm transition-all ${
            activeMode === 'BUYER' ? 'bg-gray-900 text-white' : 'bg-green-600 text-white'
          }`}>
            {activeMode === 'BUYER' ? 'Runner Mode' : 'Buyer Mode'}
          </button>

          <button onClick={handleLogout} className="p-3 text-gray-400 hover:text-red-500 bg-gray-50 rounded-2xl hover:bg-red-50 transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>

    {/* --- MOBILE BOTTOM NAVIGATION --- */}
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-40 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
      <button 
        onClick={() => setActiveMode('BUYER')}
        className={`flex flex-col items-center gap-1 ${activeMode === 'BUYER' ? 'text-orange-600' : 'text-gray-400'}`}
      >
        <div className={`p-2 rounded-xl ${activeMode === 'BUYER' ? 'bg-orange-100' : ''}`}>
           <CreditCard size={20} />
        </div>
        <span className="text-[10px] font-bold">Orders</span>
      </button>

      <button 
        onClick={toggleMode}
        className="relative -top-8 w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-gray-400 border-4 border-gray-50 active:scale-90 transition-transform"
      >
        <ArrowRightLeft size={24} />
      </button>

      <button 
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 text-gray-400"
      >
        <div className="p-2">
           <LogOut size={20} />
        </div>
        <span className="text-[10px] font-bold">Logout</span>
      </button>
    </nav>

    {/* --- MAIN CONTENT --- */}
    <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-none mb-2">
          {activeMode === 'BUYER' ? 'Get Fed.' : 'Earn Coins.'}
        </h1>
        <p className="text-gray-500 font-medium text-sm sm:text-lg">
          {activeMode === 'BUYER' ? 'Order from your favorite campus spots.' : 'Check the radar for nearby missions.'}
        </p>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeMode === 'BUYER' ? <BuyerView /> : <RunnerView />}
      </div>
    </main>
  </div>
);
};

export default Dashboard;