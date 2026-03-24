import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ShoppingBag, Bike, ShieldCheck, Wallet, RefreshCw, Zap, Instagram, Twitter, Mail, User, Linkedin, Github } from 'lucide-react';

/* ─────────────────── Animation Helpers ─────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────── Navbar ─────────────────── */
function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <span className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full"></span>
          </div>
          <span className="font-extrabold text-[#1c2438] text-lg sm:text-xl tracking-tight">
            Uni<span className="text-orange-500">Mart</span>
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-orange-500 transition-colors"
          >
            How it works
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-slate-600 hover:text-orange-500 transition-colors hidden sm:block ml-4 border-l border-slate-200 pl-4"
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/login', { state: { defaultMode: 'REGISTER' } })}
            className="text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-orange-500 text-white shadow-md hover:shadow-lg hover:bg-orange-600 transition-all duration-300 whitespace-nowrap"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────── Hero Section ─────────────────── */
function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-28 pb-16 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
      {/* High contrast minimal background */}
      <div className="hidden md:block absolute top-0 right-0 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-[#fafbfc] rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10 flex flex-col items-center text-center">
        
        <AnimatedSection delay={0.1}>
          <div className="inline-flex flex-wrap justify-center items-center gap-2 bg-orange-50 px-4 py-2 rounded-full font-bold text-xs sm:text-sm text-orange-600 mb-8 border border-orange-100">
            <span className="flex items-center gap-1"><Zap size={16} /> 15-Min Campus Delivery</span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-orange-300 mx-1"></span>

          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1c2438] leading-tight tracking-tight max-w-4xl mx-auto">
            The Campus <span className="text-orange-500">Food Network.</span>
          </h1>
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <p className="mt-8 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Order food to your desk, or turn your walk to class into cash. 
            A peer-to-peer delivery ecosystem powered exclusively by students.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.4} className="mt-12 w-full max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl sm:rounded-full bg-orange-500 text-white font-bold text-base sm:text-lg shadow-lg hover:bg-orange-600 transition-all active:scale-95"
          >
            <ShoppingBag size={20} /> Order Now
          </button>
          <button
            onClick={() => navigate('/login', { state: { defaultMode: 'REGISTER' } })}
            className="mt-4 sm:mt-0 w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl sm:rounded-full bg-[#1c2438] text-white font-bold text-base sm:text-lg shadow-lg hover:bg-[#2c3854] transition-all active:scale-95"
          >
            <Bike size={20} className="text-orange-400" /> Start Earning
          </button>
        </AnimatedSection>

      </div>
    </section>
  );
}

/* ─────────────────── The 5-Step Flow ─────────────────── */
function JourneyMap() {
  const steps = [
    { 
      title: "Order & Broadcast", 
      desc: "User orders on the platform → The request instantly appears on the live Runner Dashboard." 
    },
    { 
      title: "The Acceptance", 
      desc: "A nearby Runner clicks 'Accept' (Runner must maintain > ₹20 in their secure wallet)." 
    },
    { 
      title: "The Security Pin", 
      desc: "A unique, secure 4-digit PIN is immediately generated after the runner picks up the order and shown only to the User." 
    },
    { 
      title: "The Exchange", 
      desc: "Runner arrives with the food → User provides the PIN → Runner enters PIN in-app to verify." 
    },
    { 
      title: "The Payoff", 
      desc: "Transaction completes! Runner gets paid instantly → User enjoys their food." 
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#fafbfc] relative border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        
        <AnimatedSection className="text-center mb-12 flex flex-col items-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1c2438]">
            The Pin-Verify Flow
          </h2>
          <p className="mt-4 text-slate-500 text-lg sm:text-xl">
            Secure, student-to-student handoffs in 5 simple steps.
          </p>
        </AnimatedSection>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative"
        >
          {/* Vertical Track Line for Desktop */}
          <div className="hidden md:block absolute left-8 top-8 bottom-8 w-1 bg-orange-100 rounded-full"></div>

          <div className="space-y-6 md:space-y-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                variants={fadeUp}
                className="flex flex-row items-start md:items-center gap-4 md:gap-8 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 relative"
              >
                {/* Number Badge */}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-500 text-white font-black text-lg md:text-xl flex items-center justify-center shrink-0 shadow-md">
                  {index + 1}
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-[#1c2438] mb-2">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}

/* ─────────────────── Runner Wallet Economy ─────────────────── */
function RunnerWalletEconomy() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full font-bold text-sm text-slate-700 mb-6">
              <Wallet size={16} className="text-orange-500" /> Earn With Us
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1c2438] mb-6">
              The Runner Economy.
            </h2>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed">
              We built a sustainable, micro-transaction wallet system that ensures fair pay and platform reliability.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-emerald-700 font-bold text-lg">₹20</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1c2438]">Low Entry Barrier</h4>
                  <p className="text-slate-500 mt-1">Start accepting orders immediately with just a minimum ₹20 top-up in your Runner Wallet.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-orange-600 font-bold text-lg">₹5</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1c2438]">The "Fuel" System</h4>
                  <p className="text-slate-500 mt-1">A flat ₹5 is automatically deducted from your wallet per successful delivery as a platform maintenance fee.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <RefreshCw size={20} className="text-amber-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#1c2438]">Sustainable Looping</h4>
                  <p className="text-slate-500 mt-1">Keep 100% of your delivery earnings. Just remember to top up once you hit the minimum threshold to stay active on the dashboard.</p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2} className="relative">
            <div className="aspect-square bg-[#1c2438] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full"></div>
              
              <div className="relative z-10 text-center text-white">
                <Wallet size={48} className="mx-auto mb-4 md:mb-6 text-orange-400" />
                <h3 className="text-xl md:text-2xl font-bold mb-2">My Wallet</h3>
                <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-linear-to-br from-white to-orange-200 mb-4">
                  ₹155.00
                </div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full font-bold text-sm">
                  <ShieldCheck size={16} /> Active Status
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-700/50 flex justify-between items-center text-left">
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Recent Trip</div>
                    <div className="font-bold">+ ₹30.00</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Platform Fee</div>
                    <div className="font-bold text-rose-400">- ₹5.00</div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Dual Role Feature ─────────────────── */
function DualRole() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 bg-orange-500 text-white text-center px-5 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
        <AnimatedSection>
          <RefreshCw size={48} className="mx-auto mb-8 text-orange-200" />
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            One Account.<br />Two Ways to Campus.
          </h2>
          <p className="text-lg md:text-xl text-orange-100 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Any student can be a Buyer. Any student can be a Runner. 
            Switch between ordering food and delivering food instantly through a single dashboard toggle.
          </p>
          <button
            onClick={() => navigate('/login', { state: { defaultMode: 'REGISTER' } })}
            className="w-full sm:w-auto px-8 py-4 rounded-xl sm:rounded-full bg-white text-orange-500 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all active:scale-95"
          >
            Create Your Account
          </button>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ─────────────────── Info Modal ─────────────────── */
const MODAL_DATA = {
  'runner-economy': {
    title: "Runner Economy & Wallet",
    content: "The Runner Wallet manages micro-transactions to keep the platform sustainable. Runners can top up securely. A flat fee of ₹5 per successful delivery ensures the platform remains high-quality, while runners retain 100% of the actual delivery charges paid by the buyer."
  },
  'security-details': {
    title: "End-to-End Security",
    content: "UniMart focuses on a 100% secure student ecosystem. Every delivery utilizes our proprietary Pin-Verify flow. The buyer receives a unique 4-digit PIN upon order placement. The runner cannot claim payment until this PIN is entered into the app during handoff."
  },
  'pricing': {
    title: "Transparent Pricing",
    content: "There are zero hidden fees for buyers—what you see is what you pay. For runners, the app deducts a transparent ₹5 operational fee per successfully verified delivery. No subscriptions or hidden surcharges."
  },
  'privacy': {
    title: "Privacy Policy",
    content: "Access is strictly restricted to verified university students. We do not sell your data. Location details are only shared temporarily while an active delivery is in progress, and automatically wiped afterwards."
  },
  'terms': {
    title: "Terms of Service",
    content: "By using UniMart, you agree to respect your fellow students. Fraudulent orders or failing to deliver accepted orders will result in a permanent ban from the platform. Maintain your minimum runner balance to stay active."
  },
  'help': {
    title: "Help Center",
    content: "Having issues with an order? Check the 'Orders' tab in your dashboard to dispute a charge or contact the campus administrator. For app bugs, please provide a screenshot to our support team."
  },
  'contact': {
    title: "Contact Us",
    content: "We are proudly built by students for students. Reach out directly to the UniMart core team at support@unimart.campus or visit us in the CS Building Lab during office hours."
  },
  'developer': {
    title: "Meet the Developers",
    customContent: (
      <div className="grid lg:grid-cols-2 gap-6 items-stretch pt-2 pb-2">
        {/* Ashmit card */}
        <div className="bg-[#1c2438] rounded-4xl overflow-hidden shadow-xl flex flex-col sm:flex-row relative group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 border border-slate-700">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="sm:w-[45%] h-64 sm:h-auto bg-[#101524] flex items-center justify-center shrink-0 border-r border-[#2c3854]">
             <User size={80} className="text-[#2c3854] group-hover:text-orange-400 transition-colors duration-500" />
          </div>
          <div className="p-8 sm:p-10 text-left sm:w-[55%] flex flex-col justify-center relative z-10 w-full">
            <h4 className="text-3xl font-extrabold text-white mb-6 leading-tight tracking-tight">Ashmit<br/>Choudhary</h4>
            <div className="text-xs text-slate-400 mb-8 font-mono font-bold tracking-wider space-y-4">
              <div className="flex items-center gap-3">BATCH:<span className="text-white text-sm">2023-27</span></div>
              <div className="flex items-center gap-3">BRANCH:<span className="text-white text-sm">B.Tech CSE</span></div>
            </div>
            <div className="border-l-[3px] border-orange-500 pl-4 py-1 italic text-orange-50 font-medium text-base leading-relaxed mb-6">
              "I pretend to understand my own code"
            </div>
            <div className="flex gap-4 mt-auto">
              <a href="https://github.com/ashmitchoudhar27" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-[#2dba4e] hover:border-[#2dba4e] hover:text-white transition-all hover:-translate-y-1">
                <Github size={18} />
              </a>
              <a href="https://www.linkedin.com/in/ashmitchoudhary/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-[#0077b5] hover:border-[#0077b5] hover:text-white transition-all hover:-translate-y-1">
                <Linkedin size={18} />
              </a>
              <a href="https://www.instagram.com/ashmit_choudharyy" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:border-transparent hover:text-white hover:bg-linear-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] transition-all hover:-translate-y-1">
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Hemesh card */}
        <div className="bg-[#1c2438] rounded-4xl overflow-hidden shadow-xl flex flex-col sm:flex-row relative group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 border border-slate-700">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="sm:w-[45%] h-64 sm:h-auto bg-[#101524] flex items-center justify-center shrink-0 border-r border-[#2c3854]">
             <User size={80} className="text-[#2c3854] group-hover:text-orange-400 transition-colors duration-500" />
          </div>
          <div className="p-8 sm:p-10 text-left sm:w-[55%] flex flex-col justify-center relative z-10 w-full">
            <h4 className="text-3xl font-extrabold text-white mb-6 leading-tight tracking-tight">Hemesh<br/>Pandey</h4>
            <div className="text-xs text-slate-400 mb-8 font-mono font-bold tracking-wider space-y-4">
              <div className="flex items-center gap-3">BATCH:<span className="text-white text-sm">2023-27</span></div>
              <div className="flex items-center gap-3">BRANCH:<span className="text-white text-sm">B.Tech CSE</span></div>
            </div>
            <div className="border-l-[3px] border-orange-500 pl-4 py-1 italic text-orange-50 font-medium text-base leading-relaxed mb-6">
              "Building the future of campus delivery, one commit at a time."
            </div>
            <div className="flex gap-4 mt-auto">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-[#2dba4e] hover:border-[#2dba4e] hover:text-white transition-all hover:-translate-y-1">
                <Github size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-[#0077b5] hover:border-[#0077b5] hover:text-white transition-all hover:-translate-y-1">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:border-transparent hover:text-white hover:bg-linear-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] transition-all hover:-translate-y-1">
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }
};

function InfoModal({ type, onClose }) {
  if (!type || !MODAL_DATA[type]) return null;
  const { title, content, customContent } = MODAL_DATA[type];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-5 bg-[#1c2438]/80 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${customContent ? 'max-w-6xl p-6 sm:p-10' : 'max-w-lg p-8 md:p-10'} bg-white rounded-4xl shadow-2xl relative border border-slate-100 max-h-[95vh] overflow-y-auto overflow-x-hidden`}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors font-bold text-lg z-50"
        >
          ✕
        </button>
        <h3 className="text-3xl font-extrabold text-[#1c2438] mb-6 pr-8 leading-tight">{title}</h3>
        
        {content && (
          <p className="text-slate-600 text-lg leading-relaxed font-medium">
            {content}
          </p>
        )}

        {customContent && customContent}

        {!customContent && (
          <div className="mt-10">
            <button onClick={onClose} className="w-full py-4 bg-[#1c2438] hover:bg-orange-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95">
              Got it, thanks!
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─────────────────── Footer ─────────────────── */
function Footer({ onOpenModal }) {
  return (
    <footer className="bg-[#1c2438] pt-20 pb-10 border-t border-[#2c3854]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 lg:gap-8 mb-16 text-slate-300">
          
          {/* Brand Col */}
          <div className="sm:col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
              </div>
              <span className="font-extrabold text-white text-2xl tracking-tight">
                Uni<span className="text-orange-500">Mart</span>
              </span>
            </div>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-8">
              Revolutionizing campus dining through peer-to-peer delivery. 
              By students, for students. Fast, affordable, and community-driven.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[#2c3854] flex items-center justify-center text-slate-300 hover:bg-orange-500 hover:text-white transition-all hover:-translate-y-1">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#2c3854] flex items-center justify-center text-slate-300 hover:bg-orange-500 hover:text-white transition-all hover:-translate-y-1">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#2c3854] flex items-center justify-center text-slate-300 hover:bg-orange-500 hover:text-white transition-all hover:-translate-y-1">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">Platform</h4>
            <ul className="space-y-4">
              <li><button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-400 transition-colors">How it works</button></li>
              <li><button onClick={() => onOpenModal('runner-economy')} className="hover:text-orange-400 transition-colors">Runner Economy</button></li>
              <li><button onClick={() => onOpenModal('security-details')} className="hover:text-orange-400 transition-colors">Security Details</button></li>
              <li><button onClick={() => onOpenModal('pricing')} className="hover:text-orange-400 transition-colors">Pricing</button></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">Legal & Help</h4>
            <ul className="space-y-4">
              <li><button onClick={() => onOpenModal('privacy')} className="hover:text-orange-400 transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => onOpenModal('terms')} className="hover:text-orange-400 transition-colors">Terms of Service</button></li>
              <li><button onClick={() => onOpenModal('help')} className="hover:text-orange-400 transition-colors">Help Center</button></li>
              <li><button onClick={() => onOpenModal('contact')} className="hover:text-orange-400 transition-colors">Contact Us</button></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#2c3854] flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} UniMart Technologies. All rights reserved.
          </p>
          <button onClick={() => onOpenModal('developer')} className="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-2">
            <User size={16} /> Know the Developers
          </button>
        </div>
        
      </div>
    </footer>
  );
}

/* ─────────────────── Main Export ─────────────────── */
export default function LandingPage() {
  const [activeModal, setActiveModal] = useState(null);

  return (
    <div className="font-sans min-h-screen bg-[#fafbfc] selection:bg-orange-100 selection:text-orange-900 w-full max-w-[100vw] overflow-x-hidden relative">
      <Navbar />
      <Hero />
      <JourneyMap />
      <RunnerWalletEconomy />
      <DualRole />
      <Footer onOpenModal={setActiveModal} />
      
      {/* Modal Render */}
      {activeModal && <InfoModal type={activeModal} onClose={() => setActiveModal(null)} />}
    </div>
  );
}
