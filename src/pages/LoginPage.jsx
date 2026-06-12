import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Package } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setToken, setUser } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`http://localhost:5005${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLogin) {
        setToken(data.token);
        setUser(data.user);
        navigate('/');
      } else {
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4 backdrop-blur-sm">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">StockFlow AI</h1>
          <p className="text-indigo-100 mt-2 text-sm">Enterprise Management System</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          {error && (
            <div className={`p-3 rounded-lg text-sm mb-4 ${error.includes('successful') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none"
                placeholder="admin@stockflow.ai"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/30 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 mt-2"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
