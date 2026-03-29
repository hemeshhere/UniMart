import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, Plus, Minus, ArrowLeft, MapPin, Info, Navigation } from 'lucide-react';
import { getCanteenById, createOrder, getActiveCustomerOrder } from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const CanteenMenu = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const headerName = location.state?.canteenName || 'Loading...';
  const headerLocation = location.state?.canteenLocation || '';

  const queryClient = useQueryClient();

  const [cart, setCart] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  
  // 📱 Mobile-First Modal States
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [cartStep, setCartStep] = useState(1); // 1 = Cart Summary, 2 = Delivery Address

  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');

  const campusBuildings = [
    'BH-1', 'BH-2', 'BH-3', 'BH-4', 'BH-5', 'BH-6', 'BH-7', 'BS-8', 'BS-9', 'BS-10', 
    'Boys Apartment', 'Uni Mall', 'Robo-Park'
  ];

  const { data: orderRes } = useQuery({
    queryKey: ['activeCustomerOrder'],
    queryFn: getActiveCustomerOrder,
    retry: false
  });

  const { data: canteenRes, isLoading: menuLoading } = useQuery({
    queryKey: ['canteen', id],
    queryFn: () => getCanteenById(id),
    enabled: !!id
  });

  const canteen = canteenRes?.data || canteenRes;
  const actualOrder = Array.isArray(orderRes?.data) ? orderRes.data[0] : orderRes?.data;

  useEffect(() => {
    const activeStatuses = ['PENDING', 'ACCEPTED', 'PICKED_UP'];
    if (actualOrder && actualOrder.status && activeStatuses.includes(actualOrder.status)) {
      alert("You already have an active order! Please complete or cancel it first before placing a new one.");
      navigate('/dashboard');
    }
  }, [actualOrder, navigate]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) return prev.map((i) => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const updated = prev.map((i) => i._id === itemId ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0);
      if (updated.length === 0) {
        setIsCartModalOpen(false);
        setCartStep(1);
      }
      return updated;
    });
  };

  const closeModal = () => {
    setIsCartModalOpen(false);
    setTimeout(() => setCartStep(1), 300); // Reset step after close animation
  };

  const packingFee = canteen?.packingFee || 0;
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const deliveryFee = 20;
  const grandTotal = cartTotal + deliveryFee + packingFee;

  const handleCheckout = async () => {
    if (!building || !room.trim()) {
      alert("Please enter complete delivery details.");
      return;
    }

    setCheckoutLoading(true);

    const getCoords = () => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve([75.7065, 31.2545]); 
        } else {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
            () => resolve([75.7065, 31.2545]), 
            { enableHighAccuracy: true, timeout: 5000 }
          );
        }
      });
    };

    try {
      const realCoordinates = await getCoords();
      const finalAddress = `${building}, Room/Area: ${room.trim()}`;

      const orderPayload = {
        canteenId: id,
        itemDetails: {
          canteenName: canteen?.name || headerName,
          items: cart.map(item => ({ name: item.name, qty: item.qty, price: item.price }))
        },
        pricing: { 
          canteenItemTotal: cartTotal, 
          packingFee: packingFee,
          deliveryFee: deliveryFee,
          totalToPayAtDoor: grandTotal
        },
        deliveryLocation: finalAddress, 
        pickupCoordinates: [75.7051, 31.2530],
        dropoffCoordinates: realCoordinates 
      };

      await createOrder(orderPayload);
      queryClient.invalidateQueries({ queryKey: ['activeCustomerOrder'] });
      queryClient.invalidateQueries({ queryKey: ['availableTasks'] });
      
      setCart([]); 
      closeModal();
      navigate('/dashboard'); 
    } catch (error) {
      alert(error.response?.data?.message || "Failed to place order.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative min-h-screen pb-32">
        {/* Navigation & Header Card */}
        <button 
          onClick={() => navigate('/dashboard')} 
          className="group flex items-center gap-2 text-gray-500 hover:text-orange-600 font-semibold mb-6 transition-all bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 w-fit"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Campus
        </button>
        
        <div className="bg-white p-6 sm:p-8 rounded-4xl shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-60"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                {canteen?.name || headerName}
              </h2>
              <p className="text-gray-500 text-sm flex items-center gap-1.5 font-bold bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-200">
                <MapPin size={14} className="text-orange-500" /> 
                {canteen?.location || headerLocation}
              </p>
            </div>
            <div className="hidden sm:flex bg-orange-100 p-4 rounded-2xl text-orange-500">
              <Store size={32} />
            </div>
          </div>
        </div>

        {/* Menu Items List */}
        <div className="space-y-8">
          {menuLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex gap-4 p-5 border border-gray-100 rounded-2xl animate-pulse bg-white">
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 bg-gray-200 rounded-full w-1/3"></div>
                    <div className="h-3 bg-gray-100 rounded-full w-1/4"></div>
                  </div>
                  <div className="w-20 h-10 bg-gray-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : canteen?.menu && canteen.menu.length > 0 ? (
            <>
              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-4 sticky top-2 z-20 bg-white/90 backdrop-blur-md p-2 -mx-4 px-4 sm:mx-0 sm:px-2 rounded-2xl">
                {['All', ...new Set(canteen.menu.map((cat, index) => cat.categoryName || (index === 0 ? "Recommended" : null)).filter(Boolean))].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all shrink-0
                      ${activeCategory === cat 
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 border border-orange-600' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu Grid */}
              {canteen.menu.map((category, index) => {
                const isCategoryFormat = category.categoryName && Array.isArray(category.items);
                const sectionTitle = isCategoryFormat ? category.categoryName : (index === 0 ? "Recommended" : null);

                if (activeCategory !== 'All' && sectionTitle !== activeCategory) return null;

                const itemsToRender = isCategoryFormat ? category.items : [category];

                return (
                  <div key={category._id || `cat-${index}`} className="mb-8 animate-fade-in">
                  {sectionTitle && (
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-black text-gray-900">{sectionTitle}</h3>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {itemsToRender.map((item) => {
                      if (!item || !item.name) return null; 
                      const cartItem = cart.find(i => i._id === item._id);
                      return (
                        <div key={item._id || item.name} className={`flex justify-between items-center bg-white p-4 rounded-2xl shadow-xs border border-gray-100 ${item.isAvailable === false ? 'opacity-50 grayscale' : ''}`}>
                          <div className="pr-3">
                            <div className="flex items-start gap-2 mb-1">
                              {item.isVeg !== undefined && (
                                <div className={`mt-1 w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${item.isVeg ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                </div>
                              )}
                              <h4 className="font-bold text-gray-800 text-[15px] leading-tight">{item.name}</h4>
                            </div>
                            <p className="text-gray-900 font-black text-sm ml-5">₹{item.price}</p>
                          </div>

                          <div className="shrink-0">
                            {item.isAvailable === false ? (
                              <span className="text-red-500 text-[10px] font-black bg-red-50 px-2 py-1 rounded border border-red-100">OUT OF STOCK</span>
                            ) : cartItem ? (
                              <div className="flex items-center gap-3 bg-white rounded-lg p-1 border border-orange-200 shadow-sm">
                                <button onClick={() => removeFromCart(item._id)} className="p-1.5 hover:bg-orange-50 rounded text-orange-600"><Minus size={14} strokeWidth={3} /></button>
                                <span className="font-bold w-3 text-center text-sm text-gray-900">{cartItem.qty}</span>
                                <button onClick={() => addToCart(item)} className="p-1.5 hover:bg-orange-50 rounded text-orange-600"><Plus size={14} strokeWidth={3} /></button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => addToCart(item)} 
                                className="text-orange-600 bg-orange-50 hover:bg-orange-100 font-bold text-sm px-5 py-2 rounded-lg transition-colors border border-orange-100"
                              >
                                ADD
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </>
          ) : (
            <div className="p-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">Menu Unavailable</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Bottom Cart Bar ── */}
      {cart.length > 0 && !isCartModalOpen && (
        <div className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto z-40 animate-fade-in">
          <div 
            onClick={() => setIsCartModalOpen(true)}
            className="bg-gray-900 rounded-2xl p-3 shadow-2xl flex items-center justify-between text-white border border-gray-800 cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3 pl-2">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm leading-tight">{cart.reduce((total, item) => total + item.qty, 0)} Items</div>
                <div className="text-white/80 font-medium text-xs">₹{grandTotal} • View Cart</div>
              </div>
            </div>
            
            <button className="flex items-center justify-center gap-1 font-black text-sm pr-3 pl-4 py-2 text-white bg-white/10 rounded-xl">
              CHECKOUT
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile-Optimized Cart Bottom Sheet ── */}
      {isCartModalOpen && cart.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-5 animate-in fade-in duration-200" onClick={closeModal}>
          <div 
            className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-3xl p-6 pb-8 shadow-2xl flex flex-col transform animate-in slide-in-from-bottom-full duration-300"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '85vh' }} // Leaves a little room at top on mobile
          >
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
              {cartStep === 1 ? (
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-orange-500" /> Your Order
                </h3>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setCartStep(1)} className="p-1 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={22} />
                  </button>
                  <h3 className="text-xl font-black text-gray-900">Delivery Info</h3>
                </div>
              )}
              <button onClick={closeModal} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">✕</button>
            </div>
            
            {/* STEP 1: CART SUMMARY */}
            {cartStep === 1 && (
              <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-left-4 fade-in duration-200">
                <div className="space-y-4 mb-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {cart.map(item => (
                    <div key={item._id} className="flex justify-between items-start text-sm border-b border-gray-50 pb-3">
                      <div className="flex items-start gap-3 flex-1 pr-4">
                        <span className="font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs mt-0.5">
                          {item.qty}x
                        </span>
                        <span className="text-gray-700 font-bold leading-tight">{item.name}</span>
                      </div>
                      <span className="font-black text-gray-900 mt-0.5">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-2 mb-4 border border-gray-100 shrink-0">
                  <div className="flex justify-between text-xs text-gray-500 font-bold">
                    <span>Item Total</span><span>₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-bold">
                    <span>Delivery Fee</span><span>₹{deliveryFee}</span>
                  </div>
                  {packingFee > 0 && (
                    <div className="flex justify-between text-xs text-gray-500 font-bold">
                      <span>Packing Charge</span><span>₹{packingFee}</span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-gray-200 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-gray-800 font-black text-sm">To Pay</span>
                    <span className="text-xl font-black text-gray-900">₹{grandTotal}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setCartStep(2)} 
                  className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white py-4 rounded-xl font-black text-base shadow-lg shadow-orange-500/30 transition-all shrink-0"
                >
                  Next: Add Address →
                </button>
              </div>
            )}

            {/* STEP 2: DELIVERY ADDRESS */}
            {cartStep === 2 && (
              <div className="flex flex-col h-full animate-in slide-in-from-right-4 fade-in duration-200">
                <div className="mb-6 flex-1">
                  
                  {/* Big Touch Targets for Mobile */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Hostel / Block</label>
                      <select
                        value={building}
                        onChange={(e) => setBuilding(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 focus:bg-white outline-none rounded-xl px-4 py-4 text-base font-bold text-gray-900 transition-colors appearance-none"
                      >
                        <option value="" disabled>Select your location...</option>
                        {campusBuildings.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Room / Area Details</label>
                      <input
                        type="text"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        placeholder="e.g. Room 412 or Infront of UniMall "
                        className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-500 focus:bg-white outline-none rounded-xl px-4 py-4 text-base font-bold text-gray-900 transition-colors placeholder:font-medium placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Gentle reminder about GPS */}
                  <div className="mt-6 flex items-start gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <Navigation size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-blue-800 leading-relaxed">
                      We'll ask for your device location when you place the order to help the runner navigate campus.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout} 
                  disabled={checkoutLoading || !building || !room.trim()}
                  className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-black text-base transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 flex justify-center items-center gap-2 shrink-0"
                >
                  {checkoutLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    `Place Order • ₹${grandTotal}`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CanteenMenu;