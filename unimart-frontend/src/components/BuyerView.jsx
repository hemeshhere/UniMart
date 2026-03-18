import { useState, useEffect } from 'react';
import { Store, ShoppingBag, Plus, Minus, ArrowLeft, MapPin, Clock, Bike, CheckCircle, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { getCanteens, getCanteenById, createOrder, getActiveCustomerOrder, cancelOrder } from '../services/api';
import { createPortal } from "react-dom";
const BuyerView = () => {
  // Data States
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null); 
  
  // Loading & UI States
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false); 
  const [showCancelModal, setShowCancelModal] = useState(false); // 🛡️ NEW: Modal State
  // --- 1. THE GATEKEEPER: Check for Active Orders on Load ---
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        try {
          const orderRes = await getActiveCustomerOrder();
          const actualOrder = Array.isArray(orderRes.data) ? orderRes.data[0] : orderRes.data;
          // If the status is CANCELLED or DELIVERED, it will ignore it and let them order again.
          const activeStatuses = ['PENDING', 'ACCEPTED', 'PICKED_UP'];
          if (actualOrder && actualOrder.status && activeStatuses.includes(actualOrder.status)) {
            setActiveOrder(actualOrder);
            setLoading(false);
            return; 
          }
        } catch (err) {
          console.log("No active orders found. Proceeding to menu...");
        }

        const res = await getCanteens();
        const canteenData = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        setCanteens(canteenData);
      } catch (error) {
        console.warn("⚠️ API failed to load canteens.");
      } finally {
        setLoading(false);
      }
    };
    
    initializeDashboard();
  }, []);

  // --- 2. Menu Fetching Logic ---
  const handleCanteenClick = async (canteenSummary) => {
    if (!canteenSummary.isOpen) return; 
    setMenuLoading(true); 
    try {
      const res = await getCanteenById(canteenSummary._id);
      setSelectedCanteen(res.data || res);
    } catch (error) {
      alert("Could not load the menu for this canteen.");
    } finally {
      setMenuLoading(false);
    }
  };

  // --- 3. Cart Logic ---
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

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const deliveryFee = 20;

  // --- 4. Checkout Logic ---
  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const orderPayload = {
        itemDetails: {
          canteenName: selectedCanteen.name,
          items: cart.map(item => ({ name: item.name, qty: item.qty, price: item.price }))
        },
        pricing: { canteenItemTotal: cartTotal, deliveryFee: deliveryFee },
        pickupCoordinates: [75.7051, 31.2530],
        dropoffCoordinates: [75.7065, 31.2545] 
      };

      const res = await createOrder(orderPayload);
      setActiveOrder(res.data || res); 
      setCart([]); 
      setSelectedCanteen(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to place order.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // --- 5. Custom Overlay Cancel Logic ---
  const executeCancelOrder = async () => {
    setCancelLoading(true);
    try {
      await cancelOrder(activeOrder._id);
      setActiveOrder(null); 
      setShowCancelModal(false); // Close the modal
      
      if (canteens.length === 0) {
        const res = await getCanteens();
        setCanteens(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel the order. It might already be picked up!");
      setShowCancelModal(false); // Close the modal on error too
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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                
                {/* Modal Card */}
                <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 p-6 animate-fade-in">
                    
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-50">
                        <AlertTriangle className="text-red-500" size={22} />
                    </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-semibold text-gray-900 text-center">
                    Cancel Order
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
                    Are you sure you want to cancel this order? This action cannot be undone.
                    </p>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col gap-2">
                    
                    {/* Primary Action */}
                    <button
                        onClick={executeCancelOrder}
                        disabled={cancelLoading}
                        className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelLoading ? "Cancelling..." : "Cancel Order"}
                    </button>

                    {/* Secondary Action */}
                    <button
                        onClick={() => setShowCancelModal(false)}
                        disabled={cancelLoading}
                        className="w-full py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition"
                    >
                        Keep Order
                    </button>
                    </div>
                </div>
                </div>,
                document.body
            )
        }

        {/* Header Status Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Active Mission</h2>
              <p className="text-gray-500">From {activeOrder.itemDetails?.canteenName}</p>
            </div>
            <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-lg font-bold shadow-inner">
              ₹{activeOrder.pricing?.canteenItemTotal + activeOrder.pricing?.deliveryFee} to pay
            </div>
          </div>

          {/* Dynamic Status Timeline */}
          <div className="relative pt-4 pb-2">
            <div className="absolute top-8 left-10 right-10 h-1 bg-gray-100 rounded"></div>
            <div className={`absolute top-8 left-10 h-1 rounded transition-all duration-500 ${
              activeOrder.status === 'PENDING' ? 'w-0' : 
              activeOrder.status === 'ACCEPTED' ? 'w-1/2 bg-blue-500' : 
              activeOrder.status === 'PICKED_UP' ? 'w-full bg-green-500' : 'w-0'
            }`}></div>
            
            <div className="relative flex justify-between">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg z-10">
                  <Clock size={20} />
                </div>
                <p className="text-xs font-bold mt-2 text-gray-800">Pending</p>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md z-10 transition-colors ${['ACCEPTED', 'PICKED_UP'].includes(activeOrder.status) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <UserCheck size={20} />
                </div>
                <p className={`text-xs font-bold mt-2 ${['ACCEPTED', 'PICKED_UP'].includes(activeOrder.status) ? 'text-gray-800' : 'text-gray-400'}`}>Accepted</p>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md z-10 transition-colors ${activeOrder.status === 'PICKED_UP' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Bike size={20} />
                </div>
                <p className={`text-xs font-bold mt-2 ${activeOrder.status === 'PICKED_UP' ? 'text-gray-800' : 'text-gray-400'}`}>On the Way</p>
              </div>
            </div>
          </div>
        </div>

        {/* The Security PIN Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <ShieldCheck className="absolute -right-6 -top-6 text-gray-700 opacity-30" size={120} />
          <h3 className="text-lg font-medium text-gray-300 mb-1 relative z-10">Delivery Security PIN</h3>
          <p className="text-sm text-gray-400 mb-4 relative z-10">Only share this code with the Runner when they hand you the food.</p>
          <div className="text-5xl font-extrabold tracking-widest text-green-400 relative z-10">
            {activeOrder.deliveryPIN || "••••"}
          </div>
        </div>

        {/* Order Details Receipt */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><ShoppingBag size={18}/> Order Summary</h3>
          <div className="space-y-3 mb-4">
            {activeOrder.itemDetails?.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">{item.qty}x {item.name}</span>
                <span className="text-gray-900 font-bold">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 text-sm text-gray-500 flex justify-between">
            <span>Delivery Fee</span>
            <span className="text-gray-900 font-bold">₹{activeOrder.pricing?.deliveryFee}</span>
          </div>
        </div>

        {/* Actions Container */}
        <div className="flex flex-col gap-2">
          {/* Refresh Button */}
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-4 text-center text-gray-500 font-medium bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
          >
            Refresh Status
          </button>

          {/* Cancel Button (Triggers the custom modal) */}
          {activeOrder.status !== 'PICKED_UP' && (
            <button 
              onClick={() => setShowCancelModal(true)} // Opens the new modal!
              className="w-full py-4 text-center text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>

      </div>
    );
  }

  // ==========================================
  // VIEW 2 & 3: CANTEEN GRID & MENU (Unchanged)
  // ==========================================
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (selectedCanteen) {
    return (
      <div className="flex flex-col lg:flex-row gap-8 animate-slide-in relative">
        {menuLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500 mb-3"></div>
            <p className="text-gray-800 font-bold">Loading Menu...</p>
          </div>
        )}

        <div className="flex-1">
          <button onClick={() => { setSelectedCanteen(null); setCart([]); }} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors">
            <ArrowLeft size={20} /> Back to Canteens
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCanteen.name}</h2>
          <p className="text-gray-500 flex items-center gap-2 mb-6"><MapPin size={16} /> {selectedCanteen.location}</p>

          <div className="space-y-8">
            {Array.isArray(selectedCanteen.menu) && selectedCanteen.menu.length > 0 ? (
              selectedCanteen.menu.map((category, index) => {
                const isCategoryFormat = category.categoryName && Array.isArray(category.items);
                const itemsToRender = isCategoryFormat ? category.items : [category];
                const sectionTitle = isCategoryFormat ? category.categoryName : (index === 0 ? "Menu Items" : null);

                return (
                  <div key={category._id || `cat-${index}`}>
                    {sectionTitle && <h3 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">{sectionTitle}</h3>}
                    <div className="space-y-4">
                      {itemsToRender.map((item) => {
                        if (!item || !item.name) return null; 
                        const cartItem = cart.find(i => i._id === item._id);
                        return (
                          <div key={item._id || item.name} className={`flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-all ${item.isAvailable === false ? 'opacity-50 grayscale' : 'hover:border-orange-200'}`}>
                            <div>
                              <div className="flex items-center gap-2">
                                {item.isVeg !== undefined && (
                                  <span className={`w-3 h-3 rounded-sm border ${item.isVeg ? 'border-green-500 bg-green-100' : 'border-red-500 bg-red-100'} flex items-center justify-center`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                  </span>
                                )}
                                <h4 className="font-semibold text-gray-800">{item.name}</h4>
                              </div>
                              <p className="text-orange-600 font-bold font-mono mt-1">₹{item.price}</p>
                            </div>
                            {item.isAvailable === false ? (
                              <span className="text-red-500 text-xs font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">OUT OF STOCK</span>
                            ) : cartItem ? (
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200 shadow-sm">
                                <button onClick={() => removeFromCart(item._id)} className="p-1.5 hover:bg-white rounded text-gray-600 transition-colors"><Minus size={16} /></button>
                                <span className="font-bold w-4 text-center text-gray-800">{cartItem.qty}</span>
                                <button onClick={() => addToCart(item)} className="p-1.5 hover:bg-white rounded text-gray-600 transition-colors"><Plus size={16} /></button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(item)} className="text-orange-600 bg-orange-50 hover:bg-orange-600 hover:text-white px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-sm">ADD</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                <Store className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 font-medium text-lg">Menu is currently unavailable.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        {cart.length > 0 && (
          <div className="w-full lg:w-96 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 h-fit sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6 pb-4 border-b border-gray-100"><ShoppingBag size={24} className="text-orange-500" /> Your Order</h3>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item._id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">{item.qty}x</span>
                    <span className="text-gray-700 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 p-4 rounded-xl space-y-3 mb-6 border border-gray-100">
              <div className="flex justify-between text-sm text-gray-600"><span>Item Total</span><span className="font-medium">₹{cartTotal}</span></div>
              <div className="flex justify-between text-sm text-gray-600"><span>Delivery Fee</span><span className="font-medium">₹{deliveryFee}</span></div>
              <div className="flex justify-between text-lg font-extrabold text-gray-900 pt-3 border-t border-gray-200 mt-2"><span>Total to Pay</span><span className="text-orange-600">₹{cartTotal + deliveryFee}</span></div>
            </div>
            <button 
              onClick={handleCheckout} disabled={checkoutLoading}
              className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold shadow-md transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {checkoutLoading ? 'Broadcasting...' : 'Confirm Order'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Canteen Grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {canteens.length === 0 ? (
        <div className="col-span-full text-center py-20 text-gray-500">No canteens available right now.</div>
      ) : (
        canteens.map((canteen) => (
          <div key={canteen._id} onClick={() => handleCanteenClick(canteen)} className={`bg-white rounded-2xl p-6 border border-gray-100 transition-all ${canteen.isOpen ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:border-orange-200' : 'opacity-60 grayscale cursor-not-allowed'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="bg-orange-50 p-3 rounded-xl text-orange-600"><Store size={28} /></div>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${canteen.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{canteen.isOpen ? 'OPEN' : 'CLOSED'}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{canteen.name}</h3>
            <p className="text-gray-500 text-sm flex items-center gap-1.5 font-medium"><MapPin size={14} className="text-gray-400"/> {canteen.location}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default BuyerView;