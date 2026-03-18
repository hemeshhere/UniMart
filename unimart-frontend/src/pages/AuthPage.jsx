import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MapPin } from 'lucide-react';
import { loginUser, registerUser, verifyOTP } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const { authenticate } = useContext(AuthContext);

  // Clean State Machine: 'LOGIN' | 'REGISTER' | 'OTP'
  const [authMode, setAuthMode] = useState('LOGIN'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', hostelBlock: '', otp: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear errors when user types
  };

  const toggleMode = () => {
    setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
    setError('');
    setSuccess('');
    setFormData({ name: '', email: '', password: '', hostelBlock: '', otp: '' });
  };

  // --- ACTIONS ---

  const executeLogin = async () => {
    const res = await loginUser(formData.email, formData.password);
    
    // 1. Grab the user data exactly where your console log says it is
    const userData = res.data?.user || res.data; 
    
    // 2. If backend uses HttpOnly cookies, res.token is undefined. Use a fallback flag.
    const token = res.token || 'secure-cookie-active';

    if (!userData) {
      throw new Error("Invalid response from server. Missing user data.");
    }

    authenticate(userData, token);
    navigate('/dashboard'); 
  };

  const executeRegister = async () => {
    const lpuRegex = /^[a-zA-Z0-9._%+-]+@lpu\.in$/i;
    if (!lpuRegex.test(formData.email)) {
      throw new Error('Security Policy: You must use your official @lpu.in email address.');
    }

    const res = await registerUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      hostelBlock: formData.hostelBlock
    });
    
    setSuccess(res.message || 'OTP Sent to your university email! Please verify.');
    setAuthMode('OTP'); // Move to next phase
  };

  const executeOTPVerification = async () => {
    const res = await verifyOTP(formData.email, formData.otp);
    
    const userData = res.data?.user || res.data;
    const token = res.token || 'secure-cookie-active';

    if (!userData) {
      throw new Error("Invalid response from server. Missing user data.");
    }

    authenticate(userData, token);
    navigate('/dashboard');
  };

  // --- MAIN HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (authMode === 'LOGIN') await executeLogin();
      else if (authMode === 'REGISTER') await executeRegister();
      else if (authMode === 'OTP') await executeOTPVerification();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-white overflow-hidden">
      {/* --- HERO SECTION (Left) --- */}
      <div className="flex-none md:flex-[1.2] relative pt-10 px-5 pb-5 md:py-15 md:px-20 flex flex-col justify-center text-center md:text-left bg-[#fafbfc] overflow-hidden">
        <div className="animate-fade-in relative z-10 w-full h-full flex flex-col justify-center">
          {/* Text Content Wrapper */}
          <div className="relative z-20 flex flex-col items-center md:items-start md:max-w-112.5 lg:max-w-137.5 xl:-translate-x-8">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full font-semibold text-sm text-primary-orange shadow-sm mb-5 md:mb-7.5">
              <span className="w-2 h-2 bg-primary-orange rounded-full"></span>UniMart Delivery
            </div>
            <h1 className="text-[3.5rem] md:text-[3.5rem] lg:text-[4.5rem] leading-[1.1] font-extrabold text-text-dark mb-6 text-center md:text-left">
              Fastest <br /><span className="text-primary-orange">Delivery</span> & <br />Easy <span className="text-primary-orange">Pickup.</span>
            </h1>
            <p className="text-[1.1rem] text-text-gray max-w-100 leading-[1.6] mb-7.5 md:mb-10 text-center md:text-left">
              UniMart assures fresh grocery every morning to your hostel without getting out.
            </p>
          </div>

          {/* Floating Image Wrapper */}
          <div className="relative md:absolute right-0 top-0 md:-right-[20%] md:top-[10%] lg:-right-[5%] lg:top-[10%] w-full h-75 md:w-[60%] md:h-[80%] mt-7.5 md:mt-0 opacity-100 md:opacity-30 lg:opacity-100 z-1">
             <div className="hidden md:block absolute -right-25 top-1/2 -translate-y-1/2 w-150 h-150 rounded-full z-1 shadow-[inset_0_0_50px_rgba(248,144,37,0.05)] shadow-lg bg-linear-to-br from-[#fff9f0] to-[#fff]"></div>
             <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-100 h-100 rounded-full z-2 shadow-md bg-linear-to-br from-[#fff9f0] to-[#fff]"></div>
             <img src="/delivery.png" alt="Delivery Scooter" className="relative right-auto top-auto md:absolute md:right-12.5 md:top-[10%] h-full w-auto block mx-auto md:h-[80%] md:object-contain z-3 mix-blend-multiply animate-float" />
          </div>
        </div>
      </div>

      {/* --- FORM SECTION (Right) --- */}
      <div className="flex-[0.8] flex items-center justify-center p-5 md:p-10 bg-white border-t border-[rgba(0,0,0,0.05)] md:border-t-0 md:border-l">
        <div className="w-full max-w-110 bg-white p-7.5 md:p-10 rounded-2xl shadow-[0_10px_25px_rgba(27,38,65,0.05)] md:shadow-[0_15px_35px_rgba(27,38,65,0.08)] animate-slide-in">
          <div className="mb-7.5">
            <h2 className="text-[2rem] text-dark-blue mb-2 font-bold">
              {authMode === 'OTP' ? 'Verify OTP' : authMode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-text-gray text-[0.95rem]">
              {authMode === 'OTP' ? 'Enter the 6-digit code sent to your email' : 'Securely access the UniMart campus network'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form space-y-4">
            
            {/* Show Name & Hostel ONLY during Registration */}
            {authMode === 'REGISTER' && (
              <>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={20} />
                    <input type="text" name="name" className="input-field with-icon" value={formData.name} onChange={handleChange} required />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Hostel Block / Room</label>
                  <div className="input-wrapper">
                    <MapPin className="input-icon" size={20} />
                    <input type="text" name="hostelBlock" className="input-field with-icon" placeholder="BH-1, Room 204" value={formData.hostelBlock} onChange={handleChange} required />
                  </div>
                </div>
              </>
            )}

            {/* Show Email & Password during BOTH Login and Registration */}
            {(authMode === 'LOGIN' || authMode === 'REGISTER') && (
              <>
                <div className="input-group">
                  <label className="input-label">LPU Email</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={20} />
                    <input type="email" name="email" className="input-field with-icon" placeholder="student@lpu.in" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input type="password" name="password" className="input-field with-icon" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                  </div>
                </div>
              </>
            )}

            {/* Show OTP ONLY during OTP Phase */}
            {authMode === 'OTP' && (
              <div className="input-group">
                <label className="input-label">6-Digit Security Code</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input type="text" name="otp" className="input-field with-icon tracking-widest text-center font-bold" maxLength={6} value={formData.otp} onChange={handleChange} required />
                </div>
              </div>
            )}

            {/* Status Messages */}
            {error && <div className="text-red-500 text-sm font-medium animate-fade-in">{error}</div>}
            {success && <div className="text-green-600 text-sm font-medium animate-fade-in">{success}</div>}

            <button type="submit" className="btn btn-primary submit-btn w-full mt-6" disabled={loading}>
              {loading ? 'Processing Protocol...' : authMode === 'OTP' ? 'Verify Identity' : authMode === 'LOGIN' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Footer Toggles */}
          {authMode !== 'OTP' && (
            <div className="mt-6 text-center text-[0.95rem] text-text-gray">
              <p className="text-gray-600">
                {authMode === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
                <button type="button" className="bg-none border-none text-primary-orange font-inherit font-semibold text-[0.95rem] ml-2 cursor-pointer transition-all duration-300 hover:underline" onClick={toggleMode}>
                  {authMode === 'LOGIN' ? "Register Now" : "Login Here"}
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