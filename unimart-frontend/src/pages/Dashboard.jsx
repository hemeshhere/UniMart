import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Wallet, LogOut, ArrowRightLeft, AlertCircle, ShoppingBag, Bike } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Placeholder Sub-Components (We will build these next) ---
const BuyerView = () => (
  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
    <ShoppingBag size={48} className="text-orange-500 mb-4" />
    <h2 className="text-2xl font-bold text-gray-800">Buyer Mode</h2>
    <p className="text-gray-500">Order food from campus canteens.</p>
  </div>
);

const RunnerView = () => (
  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
    <Bike size={48} className="text-green-500 mb-4" />
    <h2 className="text-2xl font-bold text-gray-800">Runner Mode</h2>
    <p className="text-gray-500">Check the Live Radar and earn UniCoins.</p>
  </div>
);

// --- Main Dashboard Component ---
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeMode, setActiveMode] = useState('BUYER'); // 'BUYER' or 'RUNNER'
  const [toastMsg, setToastMsg] = useState('');

  // Auto-hide toast messages after 3 seconds
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
      // Business Logic: Strict check for UniCoins
      if (user?.uniCoins > 10) {
        setActiveMode('RUNNER');
      } else {
        setToastMsg('Access Denied: You need more than 10 UniCoins to become a Runner. Please top up your wallet.');
      }
    } else {
      setActiveMode('BUYER');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* --- TOP NAVBAR --- */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Left: Brand & User Greeting */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="font-bold text-xl tracking-tight text-gray-900">UniMart</span>
              </div>
              <div className="hidden md:block h-6 w-px bg-gray-300"></div>
              <span className="hidden md:block text-sm text-gray-600 font-medium">
                Hello, {user?.name?.split(' ')[0] || 'Student'}
              </span>
            </div>

            {/* Right: Wallet, Toggle, Logout */}
            <div className="flex items-center gap-4">
              
              {/* Wallet Badge */}
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                <Wallet size={18} className="text-orange-600" />
                <span className="font-bold text-orange-700">{user?.uniCoins || 0}</span>
                <span className="text-xs text-orange-600 font-medium uppercase tracking-wider hidden sm:inline">UC</span>
              </div>

              {/* Mode Toggle Button */}
              <button 
                onClick={toggleMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  activeMode === 'BUYER' 
                    ? 'bg-gray-900 text-white hover:bg-gray-800' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <ArrowRightLeft size={16} />
                {activeMode === 'BUYER' ? 'Switch to Runner' : 'Switch to Buyer'}
              </button>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>

            </div>
          </div>
        </div>
      </nav>

      {/* --- ERROR TOAST NOTIFICATION --- */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-3 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg max-w-md">
            <AlertCircle className="text-red-500" size={24} />
            <p className="text-sm font-medium text-red-700">{toastMsg}</p>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic Header based on Mode */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {activeMode === 'BUYER' ? 'Order Dashboard' : 'Mission Radar'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {activeMode === 'BUYER' 
              ? 'Craving something? Get it delivered to your hostel block.' 
              : 'Accept delivery missions and earn UniCoins.'}
          </p>
        </div>

        {/* Dynamic Component Rendering */}
        <div className="transition-all duration-300 ease-in-out">
          {activeMode === 'BUYER' ? <BuyerView /> : <RunnerView />}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;