import { useState } from 'react';
import { Mail, Lock, User, MapPin } from 'lucide-react';
import { login, register, verifyOTP } from '../services/api';
import '../styles/Auth.css';

// Using a high quality image placeholder for the delivery man
const HeroImage = "https://images.unsplash.com/photo-1526367790999-0150786686a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    hostelBlock: '',
    otp: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setIsVerifying(false);
    setError(null);
    setSuccess(null);
    setFormData({ name: '', email: '', password: '', hostelBlock: '', otp: '' });
  };

  const validateEmail = (email) => {
    // Strictly allows only @lpu.in domains
    const lpuRegex = /^[a-zA-Z0-9._%+-]+@lpu\.in$/i;
    return lpuRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        setSuccess('Login successful! Redirecting...');
        // location.href = '/dashboard'; // Handle actual redirect
      } else if (isVerifying) {
        // Validation Logic: If verifyOTP() logic passes, proceed to create account.
        const res = await verifyOTP(formData.email, formData.otp);
        setSuccess(res.message || 'Registration verified successfully! Redirecting...');
        // location.href = '/dashboard'; // Handle actual redirect
      } else {
        // Email Restriction Validation Phase
        if (!validateEmail(formData.email)) {
          setError('Registration restricted: Please use your official @lpu.in email address.');
          setLoading(false);
          return;
        }

        // OTP Trigger Phase
        const response = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          hostelBlock: formData.hostelBlock
        });
        
        // UI State: Toggle visibility to OTP Verification Step
        setSuccess(response.message || 'OTP Sent to your university email! Please verify.');
        setIsVerifying(true);
      }
    } catch (err) {
      // If verifyOTP() fails, this block catches it and displays "Wrong OTP" or the backend error
      setError(err.response?.data?.message || 'Verification failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Section - Graphic/Hero */}
      <div className="auth-hero">
        <div className="hero-content animate-fade-in">
          <div className="brand-badge">
            <span className="badge-dot"></span>
            UniMart Delivery
          </div>
          
          <h1 className="hero-title">
            Fastest <br />
            <span className="text-primary">Delivery</span> & <br />
            Easy <span className="text-primary">Pickup.</span>
          </h1>
          
          <p className="hero-subtitle">
            UniMart assures fresh grocery every morning to your 
            hostel without getting out.
          </p>

          <div className="hero-action">
            <button className="btn btn-primary" style={{ padding: '16px 32px', borderRadius: '40px' }}>Order Now</button>
            <div className="play-btn">
              <div className="play-icon">▶</div>
              <span>Order Process</span>
            </div>
          </div>
          
          <div className="hero-testimonial">
            <img src="https://ui-avatars.com/api/?name=Chef&background=f89025&color=fff" alt="Chef avatar" className="avatar" />
            <div className="testimonial-text">
              <p>When you are too lazy to cook, we</p>
              <p>are just a click away!</p>
            </div>
          </div>
        </div>
        
        {/* Floating Elements mimicking the reference image */}
        <div className="floating-img-container">
           {/* Abstract aesthetic circle bg */}
           <div className="aesthetic-circle"></div>
           <div className="aesthetic-circle small"></div>
           {/* Delivery Man Image mapping roughly to UI image concept */}
           <img src="/delivery.png" alt="Delivery Scooter" className="delivery-hero-img animate-float" />
           
           {/* Floating food icons */}
           <div className="float-food burger animate-float">🍔</div>
           <div className="float-food salad animate-float-delayed">🥗</div>
           
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="auth-form-section">
        <div className="auth-card animate-slide-in">
          <div className="auth-header">
            <h2>{isVerifying ? 'Verify OTP' : (isLogin ? 'Welcome Back' : 'Create Account')}</h2>
            <p>
              {isVerifying 
                ? 'Enter the 6-digit code sent to your email' 
                : (isLogin ? 'Enter your details to access your account' : 'Sign up to start your UniMart journey')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && !isVerifying && (
              <>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={20} />
                    <input 
                      type="text" 
                      name="name"
                      className="input-field with-icon" 
                      placeholder="e.g. John Doe" 
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Hostel Block</label>
                  <div className="input-wrapper">
                    <MapPin className="input-icon" size={20} />
                    <input 
                      type="text" 
                      name="hostelBlock"
                      className="input-field with-icon" 
                      placeholder="e.g. Block A" 
                      value={formData.hostelBlock}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {!isVerifying && (
              <>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={20} />
                    <input 
                      type="email" 
                      name="email"
                      className="input-field with-icon" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input 
                      type="password" 
                      name="password"
                      className="input-field with-icon" 
                      placeholder="••••••••" 
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {isVerifying && (
              <div className="input-group">
                <label className="input-label">6-Digit OTP</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input 
                    type="text" 
                    name="otp"
                    className="input-field with-icon tracking-widest text-center" 
                    placeholder="123456" 
                    maxLength={6}
                    value={formData.otp}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {error && <div className="text-danger animate-fade-in">{error}</div>}
            {success && <div className="text-success animate-fade-in">{success}</div>}

            <button 
              type="submit" 
              className="btn btn-primary submit-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isVerifying ? 'Verify & Register' : (isLogin ? 'Sign In' : 'Sign Up'))}
            </button>
          </form>

          {!isVerifying && (
            <div className="auth-footer">
              <p>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button type="button" className="toggle-btn" onClick={handleToggle}>
                  {isLogin ? "Register Now" : "Login Here"}
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
