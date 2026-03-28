import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Phone, Building, Hash, Users, ArrowLeft, Key, ShieldCheck } from 'lucide-react';
import { loginUser, registerUser, verifyOTP, forgotPassword, resetPassword } from '../services/api'; // 🆕 Ensure these are exported from your api.js
import { AuthContext } from '../context/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticate } = useContext(AuthContext);

  // 🆕 Added new states for the password flow
  const [authMode, setAuthMode] = useState(location.state?.defaultMode || 'LOGIN'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 🆕 Added confirmPassword
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phoneNumber: '', hostel: '', roomNumber: '', gender: '', otp: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); 
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setError('');
    setSuccess('');
    // Wipe sensitive fields when switching modes, but keep the email if they already typed it
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '', otp: '' }));
  };

  // --- API ACTIONS ---

  const executeLogin = async () => {
    const res = await loginUser(formData.email, formData.password);
    const userData = res.data?.user || res.data; 
    const token = res.token || 'secure-cookie-active';
    if (!userData) throw new Error("Invalid response from server. Missing user data.");
    authenticate(userData, token);
    navigate('/dashboard'); 
  };

  const executeRegister = async () => {
    const lpuRegex = /^[a-zA-Z0-9._%+-]+@lpu\.in$/i;
    if (!lpuRegex.test(formData.email)) throw new Error('Security Policy: You must use your official @lpu.in email address.');

    const res = await registerUser({
      name: formData.name, email: formData.email, password: formData.password,
      phoneNumber: formData.phoneNumber, hostel: formData.hostel, roomNumber: formData.roomNumber, gender: formData.gender
    });
    setSuccess(res.message || 'OTP Sent to your university email! Please verify.');
    setAuthMode('OTP'); 
  };

  const executeOTPVerification = async () => {
    const res = await verifyOTP(formData.email, formData.otp);
    const userData = res.data?.user || res.data;
    const token = res.token || 'secure-cookie-active';
    if (!userData) throw new Error("Invalid response from server. Missing user data.");
    authenticate(userData, token);
    navigate('/dashboard');
  };

  // 🆕 Forgot Password Request
  const executeForgotPassword = async () => {
    if (!formData.email) throw new Error("Please enter your email address.");
    const res = await forgotPassword(formData.email);
    setSuccess(res.message);
    setAuthMode('RESET_PASSWORD');
  };

  // 🆕 Reset Password Execution
  const executeResetPassword = async () => {
    if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match.");
    if (formData.password.length < 6) throw new Error("Password must be at least 6 characters long.");
    
    const res = await resetPassword(formData.email, formData.otp, formData.password);
    setSuccess("Password reset successfully! You can now log in.");
    setAuthMode('LOGIN');
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '', otp: '' })); // Clear fields
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (authMode === 'LOGIN') await executeLogin();
      else if (authMode === 'REGISTER') await executeRegister();
      else if (authMode === 'OTP') await executeOTPVerification();
      else if (authMode === 'FORGOT_PASSWORD') await executeForgotPassword();
      else if (authMode === 'RESET_PASSWORD') await executeResetPassword();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for dynamic titles
  const getTitles = () => {
    switch(authMode) {
      case 'OTP': return { title: 'Check Your Email', sub: 'Enter the 6-digit verification code.' };
      case 'FORGOT_PASSWORD': return { title: 'Reset Password', sub: "Enter your email to receive a recovery code." };
      case 'RESET_PASSWORD': return { title: 'Secure Your Account', sub: 'Enter the recovery code and your new password.' };
      case 'LOGIN': return { title: 'Welcome Back', sub: 'Securely access the TheUniMart network.' };
      default: return { title: 'Create Account', sub: 'Join the student delivery ecosystem.' };
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-white overflow-hidden">
      
      {/* --- HERO SECTION (Left - Fixed) --- */}
      <div className="hidden md:flex md:flex-[1.2] relative pt-10 px-5 pb-5 md:py-15 md:px-20 flex-col justify-center text-left bg-[#fafbfc] overflow-hidden border-r border-gray-100">
        <div className="animate-in fade-in slide-in-from-left-8 duration-700 relative z-10 w-full h-full flex flex-col justify-center">
          <div className="relative z-20 flex flex-col items-start xl:-translate-x-8">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full font-bold text-xs text-orange-600 shadow-sm border border-orange-50 mb-7">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span> TheUniMart Campus Network
            </div>
            <h1 className="text-[3rem] lg:text-[4rem] leading-[1.1] font-black text-gray-900 mb-6 tracking-tight">
              Fastest <br /><span className="text-orange-500">Delivery</span> & <br />Easy <span className="text-orange-500">Pickup.</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-md leading-relaxed font-medium">
              Join the student-to-student delivery ecosystem. Earn cash on your way to class, or get food delivered right to your hostel.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-500px h-500px bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>

      {/* --- FORM SECTION (Right - Scrollable) --- */}
      <div className="flex-[0.8] h-screen overflow-y-auto flex items-center justify-center p-6 md:p-12 bg-white relative">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 right-6 md:top-8 md:right-8 text-gray-400 hover:text-gray-900 flex items-center gap-2 text-sm font-bold transition-colors"
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to Home</span>
        </button>

        <div className="w-full max-w-md animate-in slide-in-from-bottom-8 fade-in duration-500 mt-12 md:mt-0 pb-10">
          <div className="mb-8">
            <h2 className="text-3xl text-gray-900 mb-2 font-black tracking-tight">{getTitles().title}</h2>
            <p className="text-gray-500 font-medium text-sm">{getTitles().sub}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 🛑 REGISTRATION ONLY FIELDS 🛑 */}
            {authMode === 'REGISTER' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 block">Full Name</label>
                  <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                    <User className="absolute left-3.5 text-gray-400" size={18} />
                    <input type="text" name="name" className="w-full py-3 pl-10 pr-4 bg-transparent outline-none text-gray-900 font-medium" placeholder="Student" value={formData.name} onChange={handleChange} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 block">Phone Number</label>
                    <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                      <Phone className="absolute left-3.5 text-gray-400" size={16} />
                      <input type="tel" name="phoneNumber" className="w-full py-3 pl-10 pr-3 bg-transparent outline-none text-gray-900 font-medium text-sm" placeholder="10 digits" pattern="[0-9]{10}" value={formData.phoneNumber} onChange={handleChange} required />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 block">Gender</label>
                    <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                      <Users className="absolute left-3.5 text-gray-400" size={16} />
                      <select name="gender" className="w-full py-3 pl-10 pr-3 bg-transparent outline-none text-gray-900 font-medium text-sm appearance-none cursor-pointer" value={formData.gender} onChange={handleChange} required>
                        <option value="" disabled>Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 block">Hostel</label>
                    <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                      <Building className="absolute left-3.5 text-gray-400" size={16} />
                      <select name="hostel" className="w-full py-3 pl-10 pr-3 bg-transparent outline-none text-gray-900 font-medium text-sm appearance-none cursor-pointer" value={formData.hostel} onChange={handleChange} required>
                        <option value="" disabled>Select</option>
                        {[...Array(7)].map((_, i) => <option key={`BH-${i+1}`} value={`BH-${i+1}`}>BH-{i+1}</option>)}
                        {[...Array(3)].map((_, i) => <option key={`BS-${i+8}`} value={`BS-${i+8}`}>BS-{i+8}</option>)}
                        {[...Array(7)].map((_, i) => <option key={`GH-${i+1}`} value={`GH-${i+1}`}>GH-{i+1}</option>)}
                        <option value="Boys Apartment">Boys Apartment</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 block">Room No.</label>
                    <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                      <Hash className="absolute left-3.5 text-gray-400" size={16} />
                      <input type="text" name="roomNumber" className="w-full py-3 pl-10 pr-3 bg-transparent outline-none text-gray-900 font-medium text-sm" placeholder="e.g. 204" value={formData.roomNumber} onChange={handleChange} required />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🛑 EVERYONE NEEDS AN EMAIL FIELD (Except OTP verification) 🛑 */}
            {authMode !== 'OTP' && (
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 block">University Email</label>
                <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                  <Mail className="absolute left-3.5 text-gray-400" size={18} />
                  <input type="email" name="email" className="w-full py-3 pl-10 pr-4 bg-transparent outline-none text-gray-900 font-medium" placeholder="student@lpu.in" value={formData.email} onChange={handleChange} required disabled={authMode === 'RESET_PASSWORD'} />
                </div>
              </div>
            )}

            {/* 🛑 SINGLE PASSWORD FIELD (Login & Register) 🛑 */}
            {(authMode === 'LOGIN' || authMode === 'REGISTER') && (
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 block">Password</label>
                <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                  <Lock className="absolute left-3.5 text-gray-400" size={18} />
                  <input type="password" name="password" className="w-full py-3 pl-10 pr-4 bg-transparent outline-none text-gray-900 font-medium" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                </div>
                {authMode === 'LOGIN' && (
                  <div className="text-right mt-2">
                    <button type="button" onClick={() => switchMode('FORGOT_PASSWORD')} className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">Forgot Password?</button>
                  </div>
                )}
              </div>
            )}

            {/* 🛑 RESET PASSWORD FIELDS (OTP + Double Password) 🛑 */}
            {authMode === 'RESET_PASSWORD' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 block">6-Digit Recovery Code</label>
                  <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                    <Key className="absolute left-3.5 text-gray-400" size={18} />
                    <input type="text" name="otp" className="w-full py-3 pl-10 pr-4 bg-transparent outline-none text-gray-900 tracking-[0.25em] font-bold" maxLength={6} placeholder="------" value={formData.otp} onChange={handleChange} required />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 block">New Password</label>
                  <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                    <Lock className="absolute left-3.5 text-gray-400" size={18} />
                    <input type="password" name="password" className="w-full py-3 pl-10 pr-4 bg-transparent outline-none text-gray-900 font-medium" placeholder="Create new password" value={formData.password} onChange={handleChange} required minLength={6} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 block">Confirm New Password</label>
                  <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                    <ShieldCheck className="absolute left-3.5 text-gray-400" size={18} />
                    <input type="password" name="confirmPassword" className="w-full py-3 pl-10 pr-4 bg-transparent outline-none text-gray-900 font-medium" placeholder="Confirm new password" value={formData.confirmPassword} onChange={handleChange} required minLength={6} />
                  </div>
                </div>
              </div>
            )}

            {/* 🛑 ACCOUNT REGISTRATION OTP FIELD 🛑 */}
            {authMode === 'OTP' && (
              <div className="animate-in slide-in-from-right-8 duration-300">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 block text-center">6-Digit Security Code</label>
                <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                  <input type="text" name="otp" className="w-full py-4 bg-transparent outline-none text-gray-900 tracking-[0.75em] text-center font-black text-2xl" maxLength={6} placeholder="------" value={formData.otp} onChange={handleChange} required />
                </div>
              </div>
            )}

            {/* Status Messages */}
            {error && <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in duration-300 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>{error}</div>}
            {success && <div className="text-emerald-700 text-sm font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100 animate-in fade-in duration-300 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>{success}</div>}

            <button type="submit" className="w-full mt-8 py-3.5 bg-gray-900 hover:bg-black text-white font-bold text-base rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center" disabled={loading}>
              {loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                authMode === 'OTP' ? 'Verify Account' : 
                authMode === 'FORGOT_PASSWORD' ? 'Send Recovery Code' :
                authMode === 'RESET_PASSWORD' ? 'Save New Password' :
                authMode === 'LOGIN' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Footer Toggles */}
          {authMode !== 'OTP' && (
            <div className="mt-8 text-center text-sm text-gray-500 font-medium border-t border-gray-100 pt-6">
              <p>
                {authMode === 'LOGIN' ? "Don't have an account? " : 
                 authMode === 'FORGOT_PASSWORD' || authMode === 'RESET_PASSWORD' ? "Remembered your password? " : 
                 "Already have an account? "}
                <button type="button" className="text-orange-600 font-bold hover:text-orange-700 transition-colors ml-1" onClick={() => switchMode(authMode === 'REGISTER' ? 'LOGIN' : 'REGISTER')}>
                  {authMode === 'REGISTER' ? "Login Here" : 
                   authMode === 'FORGOT_PASSWORD' || authMode === 'RESET_PASSWORD' ? "Back to Login" : 
                   "Register Now"}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;