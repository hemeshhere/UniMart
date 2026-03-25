import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Store, ShoppingBag, Plus, Minus, ArrowLeft, MapPin, Info } from 'lucide-react';
import { getCanteenById, createOrder, getActiveCustomerOrder } from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const CanteenMenu = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Instant data from the dashboard click
  const headerName = location.state?.canteenName || 'Loading...';
  const headerLocation = location.state?.canteenLocation || '';

  const queryClient = useQueryClient();

  const [cart, setCart] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // React Query implementation
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
    // 🛡️ BLOCKER: Check if they already have an active order using cached data
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
    setCart((prev) => prev.map((i) => i._id === itemId ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0));
  };

  const packingFee = canteen?.packingFee || 0;
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const deliveryFee = 20;
  const grandTotal = cartTotal + deliveryFee + packingFee;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    setCheckoutLoading(true);
    try {
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
        pickupCoordinates: [75.7051, 31.2530],
        dropoffCoordinates: [75.7065, 31.2545] 
      };

      await createOrder(orderPayload);
      queryClient.invalidateQueries({ queryKey: ['activeCustomerOrder'] });
      queryClient.invalidateQueries({ queryKey: ['availableTasks'] });
      setCart([]); 
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
        
        <div className="bg-white p-8 rounded-4xl shadow-sm border border-gray-100 mb-10 relative overflow-hidden">
          {/* Decorative background blob */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-60"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                {canteen?.name || headerName}
              </h2>
              <p className="text-gray-500 flex items-center gap-2 font-medium bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-200">
                <MapPin size={16} className="text-orange-500" /> 
                {canteen?.location || headerLocation}
              </p>
            </div>
            <div className="hidden md:flex bg-orange-100 p-4 rounded-2xl text-orange-500">
              <Store size={32} />
            </div>
          </div>
        </div>

        {/* Menu Items List */}
        <div className="space-y-10">
          {menuLoading ? (
            /* Premium Skeleton Loader */
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex gap-4 p-5 border border-gray-100 rounded-2xl animate-pulse bg-white shadow-sm">
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 bg-gray-200 rounded-full w-1/3"></div>
                    <div className="h-3 bg-gray-100 rounded-full w-1/4"></div>
                  </div>
                  <div className="w-24 h-10 bg-gray-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : canteen?.menu && canteen.menu.length > 0 ? (
            <>
              {/* Category Filter Bar */}
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-4 mb-6 sticky top-2 z-20 bg-white/80 backdrop-blur-md p-2 -mx-2 px-2 rounded-2xl">
                {['All', ...new Set(canteen.menu.map((cat, index) => cat.categoryName || (index === 0 ? "Recommended" : null)).filter(Boolean))].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2 rounded-2xl font-bold whitespace-nowrap transition-all shrink-0
                      ${activeCategory === cat 
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 border border-orange-600' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm hover:text-gray-900'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {canteen.menu.map((category, index) => {
                const isCategoryFormat = category.categoryName && Array.isArray(category.items);
                const sectionTitle = isCategoryFormat ? category.categoryName : (index === 0 ? "Recommended" : null);

                if (activeCategory !== 'All' && sectionTitle !== activeCategory) return null;

                const itemsToRender = isCategoryFormat ? category.items : [category];

                return (
                  <div key={category._id || `cat-${index}`} className="mb-10 animate-fade-in">
                  {sectionTitle && (
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-xl font-bold text-gray-900">{sectionTitle}</h3>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {itemsToRender.map((item) => {
                      if (!item || !item.name) return null; 
                      const cartItem = cart.find(i => i._id === item._id);
                      return (
                        <div key={item._id || item.name} className={`flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 group ${item.isAvailable === false ? 'opacity-50 grayscale' : 'hover:shadow-md hover:border-orange-200 hover:-translate-y-1'}`}>
                          <div className="pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              {/* Better Veg/Non-Veg Indicator */}
                              {item.isVeg !== undefined && (
                                <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${item.isVeg ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
                                  <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                </div>
                              )}
                              <h4 className="font-bold text-gray-800 text-lg leading-tight group-hover:text-orange-600 transition-colors">{item.name}</h4>
                            </div>
                            <p className="text-gray-900 font-bold mt-2">₹{item.price}</p>
                          </div>

                          {/* Action Buttons */}
                          <div className="shrink-0">
                            {item.isAvailable === false ? (
                              <span className="text-red-500 text-xs font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">OUT OF STOCK</span>
                            ) : cartItem ? (
                              <div className="flex items-center gap-3 bg-white rounded-xl p-1 border border-orange-200 shadow-sm shadow-orange-100">
                                <button onClick={() => removeFromCart(item._id)} className="p-2 hover:bg-orange-50 rounded-lg text-orange-600 transition-colors"><Minus size={16} strokeWidth={3} /></button>
                                <span className="font-bold w-4 text-center text-gray-900">{cartItem.qty}</span>
                                <button onClick={() => addToCart(item)} className="p-2 hover:bg-orange-50 rounded-lg text-orange-600 transition-colors"><Plus size={16} strokeWidth={3} /></button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => item.isAvailable !== false && addToCart(item)} 
                                disabled={item.isAvailable === false}
                                className={`text-orange-600 bg-orange-50 ... ${item.isAvailable === false ? 'cursor-not-allowed' : ''}`}
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
            <div className="p-16 text-center bg-gray-50 rounded-4xl border-2 border-dashed border-gray-200">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                <Store className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-800 font-bold text-xl mb-1">Menu Unavailable</p>
              <p className="text-gray-500 font-medium">This canteen hasn't added any items yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Bottom Cart Bar ── */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl z-40 animate-fade-in">
          <div 
            onClick={() => setIsCartModalOpen(true)}
            className="bg-orange-500 rounded-4xl p-3 shadow-2xl flex items-center justify-between text-white border border-orange-600 cursor-pointer hover:shadow-orange-500/40 transition-shadow"
          >
            <div className="flex items-center gap-3 sm:gap-4 pl-1">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <ShoppingBag size={24} className="text-white" />
              </div>
              <div className="text-left">
                <div className="font-extrabold text-base sm:text-lg leading-tight">{cart.reduce((total, item) => total + item.qty, 0)} Items</div>
                <div className="text-white/80 font-medium text-xs sm:text-sm">₹{grandTotal} • <span className="underline decoration-white/40 underline-offset-2">View Cart</span></div>
              </div>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleCheckout(); }}
              disabled={checkoutLoading}
              className="flex items-center justify-center gap-2 font-black text-sm sm:text-lg pr-4 pl-6 py-2 hover:translate-x-1 transition-transform disabled:opacity-50 text-white"
            >
              {checkoutLoading ? '...' : 'NEXT →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Cart Modal ── */}
      {isCartModalOpen && cart.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1c2438]/60 backdrop-blur-sm p-0 sm:p-5 animate-fade-in" onClick={() => setIsCartModalOpen(false)}>
          <div 
            className="bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-4xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col transform translate-y-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-xl text-orange-500"><ShoppingBag size={24} /></div>
                Your Order
              </h3>
              <button 
                onClick={() => setIsCartModalOpen(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-5 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item._id} className="flex justify-between items-start text-sm group">
                  <div className="flex items-start gap-3 flex-1 pr-4">
                    <span className="font-bold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md text-xs mt-0.5">
                      {item.qty}x
                    </span>
                    <span className="text-gray-700 font-semibold leading-tight">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            {/* Receipt Summary */}
            <div className="bg-gray-50 p-5 rounded-2xl space-y-3 mb-6 border border-gray-200">
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Item Total</span>
                <span className="text-gray-900 font-semibold">₹{cartTotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span className="flex items-center gap-1">Delivery Fee <Info size={14} className="text-gray-400" /></span>
                <span className="text-gray-900 font-semibold">₹{deliveryFee}</span>
              </div>
              
              {packingFee > 0 && (
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Packing Charge</span>
                  <span className="text-gray-900 font-semibold">₹{packingFee}</span>
                </div>
              )}
              <div className="border-t-2 border-dashed border-gray-200 pt-3 mt-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-bold">To Pay</span>
                <span className="text-2xl font-black text-gray-900">₹{grandTotal}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={checkoutLoading}
              className="w-full bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {checkoutLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Broadcasting...
                </>
              ) : (
                'Confirm Order'
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CanteenMenu;