import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  BarChart3,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Real-time Analytics',
      description: 'Monitor your purchases and logistics with dynamic charts and insightful metrics.',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Smart Inventory',
      description: 'Keep track of all your commodities in real-time with comprehensive stock tracking.',
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Supplier Ledger',
      description: 'Maintain detailed accounts for every supplier, ensuring total financial transparency.',
      icon: BookOpen,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Instant Reporting',
      description: 'Generate and export instant reports for any timeframe with a single click.',
      icon: BarChart3,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text-primary)] flex flex-col font-sans">
      
      {/* --- Header Navigation --- */}
      <header className="w-full py-4 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">StockFlow AI</span>
        </div>
        <nav className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col">
        
        {/* --- Hero Section --- */}
        <section className="relative px-6 sm:px-12 py-20 lg:py-32 flex flex-col items-center text-center overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-subtle"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              <span>Next-Gen Enterprise Management</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Master your inventory with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">StockFlow AI</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed">
              The intelligent dashboard that unifies your stock inward processes, supplier ledgers, and comprehensive data analytics into one seamless experience.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-300 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Start Optimizing Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center"
              >
                Explore Features
              </button>
            </div>
          </div>
        </section>

        {/* --- Features Section --- */}
        <section id="features" className="py-20 bg-white relative">
          <div className="max-w-7xl mx-auto px-6 sm:px-12 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Everything you need to scale</h2>
              <p className="text-slate-500 text-lg">Designed from the ground up to give you total visibility and control over your supply chain.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={idx} 
                    className="glass-card p-6 border border-slate-100 hover:-translate-y-2 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-7 h-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- Trust & Security Section --- */}
        <section className="py-20 px-6 sm:px-12 bg-slate-900 text-white text-center">
          <div className="max-w-4xl mx-auto">
            <ShieldCheck className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Enterprise-grade Security</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Your data is encrypted at rest and in transit. With role-based access control and comprehensive audit logs, your supply chain data has never been safer.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-white text-slate-900 rounded-lg font-bold hover:bg-indigo-50 transition-colors"
            >
              Create Free Account
            </button>
          </div>
        </section>
        
      </main>

      {/* --- Footer --- */}
      <footer className="bg-slate-50 py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} StockFlow AI. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
