import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ShoppingBag, Bike, ShieldCheck, Wallet, RefreshCw, Zap,
  Instagram, Twitter, Mail, User, Linkedin, Github,
  Star, Clock, ChevronRight, Sparkles, TrendingUp, MapPin
} from 'lucide-react';

/* ─────────────────── Animation Helpers ─────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-100'
        : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between relative">
        {/* Glow behind UniMart logo */}
        {!scrolled && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-32 h-12 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />}
        {/* Glow behind Get Started button */}
        {!scrolled && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-32 h-12 bg-orange-500/25 rounded-full blur-2xl pointer-events-none" />}
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md shadow-orange-200">
            <ShoppingBag size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className={`font-extrabold text-xl tracking-tight transition-colors ${scrolled ? 'text-[#1c2438]' : 'text-white'}`}>
            The<span className="text-orange-400">UniMart</span>
          </span>
        </div>

        {/* Nav Actions */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className={`hidden sm:block text-sm font-semibold transition-colors ${scrolled ? 'text-slate-600 hover:text-orange-500' : 'text-white/80 hover:text-white'
              }`}
          >
            How it works
          </button>
          <button
            onClick={() => navigate('/login')}
            className={`text-sm font-semibold transition-all hidden sm:block ml-2 pl-4 border-l ${scrolled
              ? 'text-slate-600 hover:text-orange-500 border-slate-200'
              : 'text-white/80 hover:text-white border-white/20'
              }`}
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/login', { state: { defaultMode: 'REGISTER' } })}
            className="text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:scale-105 transition-all duration-300 whitespace-nowrap"
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
  const foodEmojis = ['🍕', '🍔', '🌮', '🍜', '☕', '🧆', '🍱', '🥗'];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] via-[#1a1208] to-[#1c1515]" />

      {/* Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[180px] bg-orange-500/12 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating food emojis */}
      <div className="absolute top-0 left-0 right-0 h-full overflow-hidden pointer-events-none select-none">
        {foodEmojis.map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-4xl opacity-10"
            style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 3) * 20}%` }}
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 text-center pt-28 pb-20">
        {/* Badge */}
        <AnimatedSection delay={0.1}>
          <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 px-4 py-2 rounded-full mb-8">
            <Zap size={14} className="text-orange-400" fill="currentColor" />
            <span className="text-orange-300 text-sm font-bold tracking-wide">CAMPUS-EXCLUSIVE · 20 MIN DELIVERY</span>
          </div>
        </AnimatedSection>

        {/* Headline */}
        <AnimatedSection delay={0.2}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight">
            Your Campus.
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Your Food.
            </span>
            <br />
            <span className="text-white/70 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold">Delivered Fast.</span>
          </h1>
        </AnimatedSection>

        {/* Sub-text */}
        <AnimatedSection delay={0.3}>
          <p className="mt-8 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed font-medium">
            Any student can be a Buyer. Any student can be a Runner. Switch between ordering food and delivering food instantly through a single dashboard toggle
          </p>
        </AnimatedSection>

        {/* CTA Buttons */}
        <AnimatedSection delay={0.4} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
          >
            <ShoppingBag size={22} /> Order Now <ChevronRight size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login', { state: { defaultMode: 'REGISTER' } })}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-lg hover:bg-white/15 transition-all"
          >
            <Bike size={22} className="text-orange-400" /> Start Earning
          </motion.button>
        </AnimatedSection>

        {/* Trust bar */}
        <AnimatedSection delay={0.6} className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {[
            { icon: <Clock size={14} />, text: '20 Min Avg.' },
            { icon: <ShieldCheck size={14} />, text: 'PIN Secured' },
            { icon: <TrendingUp size={14} />, text: '100% Student Run' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-white/50 text-sm font-semibold">
              <span className="text-orange-400">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </AnimatedSection>
      </div>

      {/* Bottom wave — display:block removes the inline baseline gap that causes the hairline */}
      <div className="absolute bottom-0 left-0 right-0 leading-none overflow-hidden">
        <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none" style={{ display: 'block' }}>
          <path d="M0,80 C360,0 1080,80 1440,20 L1440,80 L0,80 Z" fill="#f8f9fb" />
        </svg>
      </div>
    </section>
  );
}

/* ─────────────────── Category Strip ─────────────────── */
function CategoryStrip() {
  const categories = [
    { icon: '🍕', label: 'Pizza' },
    { icon: '🥗', label: 'Healthy' },
    { icon: '☕', label: 'Beverages' },
    { icon: '🍔', label: 'Burgers' },
    { icon: '🍜', label: 'Noodles' },
    { icon: '🧆', label: 'Snacks' },
    { icon: '🍱', label: 'Rice Bowls' },
    { icon: '🌮', label: 'Wraps' },
  ];

  return (
    <section className="py-12 bg-[#f8f9fb]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimatedSection className="text-center mb-8">
          <p className="text-sm font-bold text-orange-500 tracking-widest uppercase mb-2">What's on the menu</p>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1c2438]">Order from your Canteen</h2>
        </AnimatedSection>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide justify-start sm:justify-center flex-nowrap">
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6, scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col items-center gap-3 cursor-pointer shrink-0"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-md shadow-slate-100 border border-slate-100 flex items-center justify-center text-3xl sm:text-4xl hover:shadow-lg hover:border-orange-200 transition-all">
                {cat.icon}
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-600">{cat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── The 5-Step Flow ─────────────────── */
function JourneyMap() {
  const steps = [
    {
      icon: <ShoppingBag size={24} className="text-orange-500" />,
      title: 'Order & Broadcast',
      desc: 'User orders on the platform → The request instantly appears on the live Runner Dashboard.',
      color: 'bg-orange-50 ring-orange-100',
    },
    {
      icon: <Bike size={24} className="text-blue-500" />,
      title: 'The Acceptance',
      desc: 'A nearby Runner clicks "Accept" (Runner must maintain > ₹10 in their secure wallet).',
      color: 'bg-blue-50 ring-blue-100',
    },
    {
      icon: <ShieldCheck size={24} className="text-violet-500" />,
      title: 'The Security Pin',
      desc: 'A unique, secure 4-digit PIN is generated after pick-up and shown only to the User.',
      color: 'bg-violet-50 ring-violet-100',
    },
    {
      icon: <RefreshCw size={24} className="text-emerald-500" />,
      title: 'The Exchange',
      desc: 'Runner arrives with food → User provides the PIN → Runner enters PIN in-app to verify.',
      color: 'bg-emerald-50 ring-emerald-100',
    },
    {
      icon: <Wallet size={24} className="text-rose-500" />,
      title: 'The Payoff',
      desc: 'PIN verified! User pays the runner directly — Cash or UPI — right there at handoff. Instant, no middleman.',
      color: 'bg-rose-50 ring-rose-100',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimatedSection className="text-center mb-16">
          <p className="text-sm font-bold text-orange-500 tracking-widest uppercase mb-3">Simple & Secure</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1c2438]">
            The Pin-Verify Flow
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
            Secure, student-to-student handoffs in 5 simple steps.
          </p>
        </AnimatedSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={fadeUp}
              className="relative bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group flex flex-col items-center text-center"
            >
              <div className={`w-14 h-14 rounded-2xl ${step.color} ring-1 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {step.icon}
              </div>
              <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-slate-50 text-slate-400 text-xs font-black border border-slate-100 flex items-center justify-center">
                {index + 1}
              </span>
              <h3 className="text-base font-extrabold text-[#1c2438] mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight size={20} className="text-orange-300" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────── Stats Row ─────────────────── */
function StatsRow() {
  const stats = [
    { value: '₹20', label: 'Min. Runner Deposit', icon: <Wallet size={20} className="text-orange-500" /> },
    { value: '₹5', label: 'Deducted per delivery from runner wallet ', icon: <RefreshCw size={20} className="text-emerald-500" /> },
    { value: '100%', label: 'Earnings Kept', icon: <TrendingUp size={20} className="text-blue-500" /> },
    { value: '4-digit', label: 'PIN Security', icon: <ShieldCheck size={20} className="text-violet-500" /> },
  ];
  return (
    <section className="py-16 bg-[#f8f9fb]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
          {stats.map((s, i) => (
            <AnimatedSection key={i} delay={i * 0.1} className="h-full">
              <div className="h-full bg-white rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border border-slate-100 shadow-sm hover:shadow-md transition-all group min-h-[160px]">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shrink-0">
                  {s.icon}
                </div>
                <div className="text-3xl sm:text-4xl font-black text-[#1c2438] mb-1 leading-none">{s.value}</div>
                <div className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 leading-snug">{s.label}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Runner Wallet Economy ─────────────────── */
function RunnerWalletEconomy() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <AnimatedSection>
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">Runner Economy</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1c2438] leading-tight mb-4">
              Fair pay,<br />every delivery.
            </h2>
            <p className="text-base text-slate-400 mb-12 leading-relaxed max-w-sm">
              A transparent wallet system that keeps the platform sustainable while runners keep every rupee they earn.
            </p>

            <div className="space-y-8">
              {[
                {
                  badge: '₹20', badgeColor: 'text-emerald-600',
                  title: 'Low Entry Barrier',
                  desc: 'Start accepting orders with just a ₹20 minimum top-up in your Runner Wallet.',
                },
                {
                  badge: '₹5', badgeColor: 'text-orange-500',
                  title: 'The Fuel System',
                  desc: 'A flat ₹5 platform fee is deducted per successful delivery — transparent, every time.',
                },
                {
                  badge: '100%', badgeColor: 'text-blue-600',
                  title: 'You Keep the Rest',
                  desc: 'All delivery earnings go directly to you. Top up when your balance hits the minimum to stay active.',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-5 group">
                  <div className="w-px self-stretch bg-slate-100 group-hover:bg-orange-300 transition-colors shrink-0 ml-1" />
                  <div className="pb-2">
                    <span className={`text-xs font-black uppercase tracking-widest ${item.badgeColor} mb-1 block`}>{item.badge}</span>
                    <h4 className="text-sm font-bold text-[#1c2438] mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Wallet Card — clean dark */}
          <AnimatedSection delay={0.18}>
            <div className="bg-[#111827] rounded-3xl p-8 sm:p-10 shadow-xl border border-white/5">

              {/* Header */}
              <div className="flex items-center justify-between mb-10">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Runner Wallet</p>
                  <p className="text-white/25 text-xs font-mono mt-1">Ashmit C.</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
                  <Wallet size={16} className="text-orange-400" />
                </div>
              </div>

              {/* Balance */}
              <div className="mb-3">
                <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest mb-2">Available Balance</p>
                <p className="text-white font-black text-6xl tracking-tight leading-none">
                  ₹155<span className="text-slate-600 text-2xl font-bold">.00</span>
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-10 mt-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold">Active · Accepting Orders</span>
              </div>

              {/* Transactions */}
              <div className="border-t border-white/5 pt-6 space-y-4">
                {[
                  { label: 'Delivered – Canteen A', amount: '+₹30', pos: true },
                  { label: 'Platform Fee', amount: '-₹5', pos: false },
                  { label: 'Delivered – Library Café', amount: '+₹40', pos: true },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs">{tx.label}</span>
                    <span className={`text-xs font-bold ${tx.pos ? 'text-emerald-400' : 'text-red-400'}`}>{tx.amount}</span>
                  </div>
                ))}
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
    <section className="py-24 bg-linear-to-b from-[#1c1917] to-[#0c0a09] relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-orange-500/8 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — text */}
          <AnimatedSection>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full mb-8">
              One account, two roles
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.05] mb-6">
              Order.<br />Deliver.<br /><span className="text-orange-500">Switch anytime.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-10">
              Order from your college canteen to your desk, or flip to Runner mode and earn real cash in your free time. Same account, same app.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login', { state: { defaultMode: 'REGISTER' } })}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-full shadow-lg shadow-orange-500/20 transition-all"
              >
                <ShoppingBag size={16} /> Create account
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-full transition-all"
              >
                Log in
              </motion.button>
            </div>
          </AnimatedSection>

          {/* Right — two role cards */}
          <AnimatedSection delay={0.15} className="grid grid-cols-1 gap-4">
            {[
              {
                icon: <ShoppingBag size={22} className="text-orange-500" />,
                iconBg: 'bg-orange-500/10',
                role: 'Buyer',
                tag: 'Order',
                tagColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                desc: 'Browse the canteen menu, place an order, and track your runner in real time. Pay directly at drop-off.',
                border: 'border-white/8 hover:border-orange-500/30',
              },
              {
                icon: <Bike size={22} className="text-emerald-400" />,
                iconBg: 'bg-emerald-500/10',
                role: 'Runner',
                tag: 'Earn',
                tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                desc: 'Accept nearby orders, deliver food on campus, and collect payment — Cash or UPI — right at hand-off.',
                border: 'border-white/8 hover:border-emerald-500/30',
              },
            ].map((card, i) => (
              <div key={i} className={`bg-white/4 backdrop-blur-sm border ${card.border} rounded-2xl p-6 flex items-start gap-5 transition-all duration-300 group`}>
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  {card.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-black text-base">{card.role}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full ${card.tagColor}`}>{card.tag}</span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </AnimatedSection>

        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Info Modal ─────────────────── */
const MODAL_DATA = {
  'runner-economy': {
    title: 'Runner Economy & Wallet',
    content: 'The Runner Wallet manages micro-transactions to keep the platform sustainable. Runners can top up securely. A flat fee of ₹5 per successful delivery ensures the platform remains high-quality, while runners retain 100% of the actual delivery charges paid by the buyer.',
  },
  'security-details': {
    title: 'End-to-End Security',
    content: 'UniMart focuses on a 100% secure student ecosystem. Every delivery utilizes our proprietary Pin-Verify flow. The buyer receives a unique 4-digit PIN upon order placement. The runner cannot claim payment until this PIN is entered into the app during handoff.',
  },
  'pricing': {
    title: 'Transparent Pricing',
    content: 'There are zero hidden fees for buyers—what you see is what you pay. For runners, the app deducts a transparent ₹5 operational fee per successfully verified delivery. No subscriptions or hidden surcharges.',
  },
  'privacy': {
    title: 'Privacy Policy',
    content: 'Access is strictly restricted to verified university students. We do not sell your data. Location details are only shared temporarily while an active delivery is in progress, and automatically wiped afterwards.',
  },
  'terms': {
    title: 'Terms of Service',
    content: 'By using UniMart, you agree to respect your fellow students. Fraudulent orders or failing to deliver accepted orders will result in a permanent ban from the platform. Maintain your minimum runner balance to stay active.',
  },
  'help': {
    title: 'Help Center',
    content: "Having issues with an order? Check the 'Orders' tab in your dashboard to dispute a charge or contact the campus administrator. For app bugs, please provide a screenshot to our support team.",
  },
  'contact': {
    title: 'Contact Us',
    content: (
      <>
        We are proudly built by students for students. Reach out directly to the UniMart core team at dark07axel@gmail.com or message us on Telegram:{' '}
        <a 
          href="https://t.me/UniMartHelp" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          https://t.me/UniMartHelp
        </a>
      </>
    ),
  },
  'developer': {
    title: 'Meet the Developers',
    customContent: (
      <div className="grid lg:grid-cols-2 gap-6 items-stretch pt-2 pb-2">
        {/* Ashmit card */}
        <div className="bg-[#1c2438] rounded-4xl overflow-hidden shadow-xl flex flex-col sm:flex-row relative group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 border border-slate-700">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="sm:w-[45%] h-64 sm:h-auto bg-[#101524] flex items-center justify-center shrink-0 border-r border-[#2c3854]">
            <User size={80} className="text-[#2c3854] group-hover:text-orange-400 transition-colors duration-500" />
          </div>
          <div className="p-8 sm:p-10 text-left sm:w-[55%] flex flex-col justify-center relative z-10 w-full">
            <h4 className="text-3xl font-extrabold text-white mb-6 leading-tight tracking-tight">Ashmit<br />Choudhary</h4>
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
              <a href="https://www.instagram.com/ashmit_choudharyy" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:border-transparent hover:text-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] transition-all hover:-translate-y-1">
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Hemesh card */}
        <div className="bg-[#1c2438] rounded-4xl overflow-hidden shadow-xl flex flex-col sm:flex-row relative group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 border border-slate-700">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="sm:w-[45%] h-64 sm:h-auto bg-[#101524] flex items-center justify-center shrink-0 border-r border-[#2c3854]">
            <User size={80} className="text-[#2c3854] group-hover:text-orange-400 transition-colors duration-500" />
          </div>
          <div className="p-8 sm:p-10 text-left sm:w-[55%] flex flex-col justify-center relative z-10 w-full">
            <h4 className="text-3xl font-extrabold text-white mb-6 leading-tight tracking-tight">Hemesh<br />Pandey</h4>
            <div className="text-xs text-slate-400 mb-8 font-mono font-bold tracking-wider space-y-4">
              <div className="flex items-center gap-3">BATCH:<span className="text-white text-sm">2023-27</span></div>
              <div className="flex items-center gap-3">BRANCH:<span className="text-white text-sm">B.Tech CSE</span></div>
            </div>
            <div className="border-l-[3px] border-orange-500 pl-4 py-1 italic text-orange-50 font-medium text-base leading-relaxed mb-6">
              "Building the future of campus delivery, one commit at a time."
            </div>
            <div className="flex gap-4 mt-auto">
              <a href="https://github.com/hemeshhere" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-[#2dba4e] hover:border-[#2dba4e] hover:text-white transition-all hover:-translate-y-1">
                <Github size={18} />
              </a>
              <a href="https://www.linkedin.com/in/hemeshhere/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-[#0077b5] hover:border-[#0077b5] hover:text-white transition-all hover:-translate-y-1">
                <Linkedin size={18} />
              </a>
              <a href="https://www.instagram.com/himessshh/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:border-transparent hover:text-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] transition-all hover:-translate-y-1">
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    ),
  },
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

        {content && <p className="text-slate-600 text-lg leading-relaxed font-medium">{content}</p>}
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
    <footer className="bg-[#0f1520] pt-20 pb-10 border-t border-[#1c2438]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 lg:gap-8 mb-16 text-slate-400">

          {/* Brand Col */}
          <div className="sm:col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <ShoppingBag size={18} className="text-white" />
              </div>
              <span className="font-extrabold text-white text-2xl tracking-tight">
                The<span className="text-orange-400">UniMart</span>
              </span>
            </div>
            <p className="text-slate-500 text-base leading-relaxed max-w-sm mb-8">
              Revolutionizing campus dining through peer-to-peer delivery.
              By students, for students. Fast, affordable, and community-driven.
            </p>
            {/* <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[#1c2438] flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white transition-all hover:-translate-y-1">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#1c2438] flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white transition-all hover:-translate-y-1">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#1c2438] flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white transition-all hover:-translate-y-1">
                <Mail size={18} />
              </a>
            </div> */}
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">Platform</h4>
            <ul className="space-y-4">
              <li><button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-orange-400 transition-colors">How it works</button></li>
              <li><button onClick={() => onOpenModal('runner-economy')} className="hover:text-orange-400 transition-colors">Runner Economy</button></li>
              <li><button onClick={() => onOpenModal('security-details')} className="hover:text-orange-400 transition-colors">Security Details</button></li>
              <li><button onClick={() => onOpenModal('pricing')} className="hover:text-orange-400 transition-colors">Pricing</button></li>
            </ul>
          </div>

          {/* Legal Links */}
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
        <div className="pt-8 border-t border-[#1c2438] flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} UniMart Technologies. All rights reserved.
          </p>
          <button onClick={() => onOpenModal('developer')} className="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-2">
            <Sparkles size={16} /> Know the Developers
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
    <div className="font-sans min-h-screen bg-[#f8f9fb] selection:bg-orange-100 selection:text-orange-900 w-full max-w-[100vw] overflow-x-hidden relative">
      <Navbar />
      <Hero />
      <CategoryStrip />
      <JourneyMap />
      <StatsRow />
      <RunnerWalletEconomy />
      <DualRole />
      <Footer onOpenModal={setActiveModal} />

      {/* Modal Render */}
      {activeModal && <InfoModal type={activeModal} onClose={() => setActiveModal(null)} />}
    </div>
  );
}
