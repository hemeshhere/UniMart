import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MapPin } from 'lucide-react';
import { loginUser, registerUser, verifyOTP } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import '../styles/Auth.css';

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
    authenticate(res.user, res.token);
    navigate('/dashboard'); // Clean SPA routing
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
    authenticate(res.user, res.token);
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
    <div className="auth-container">
      {/* --- HERO SECTION (Left) --- */}
      <div className="auth-hero">
        <div className="hero-content animate-fade-in">
          <div className="brand-badge"><span className="badge-dot"></span>UniMart Delivery</div>
          <h1 className="hero-title">
            Fastest <br /><span className="text-primary">Delivery</span> & <br />Easy <span className="text-primary">Pickup.</span>
          </h1>
          <p className="hero-subtitle">UniMart assures fresh grocery every morning to your hostel without getting out.</p>
          <div className="floating-img-container">
             <div className="aesthetic-circle"></div>
             <div className="aesthetic-circle small"></div>
             <img src="/delivery.png" alt="Delivery Scooter" className="delivery-hero-img animate-float" />
          </div>
        </div>
      </div>

      {/* --- FORM SECTION (Right) --- */}
      <div className="auth-form-section">
        <div className="auth-card animate-slide-in">
          <div className="auth-header">
            <h2>
              {authMode === 'OTP' ? 'Verify OTP' : authMode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
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
            <div className="auth-footer mt-6 text-center text-sm">
              <p className="text-gray-600">
                {authMode === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
                <button type="button" className="text-orange-600 font-bold hover:underline" onClick={toggleMode}>
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