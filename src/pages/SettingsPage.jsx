/**
 * SettingsPage.jsx
 * -------------------------------------------------
 * User settings and preferences.
 */
import { useState } from 'react';
import { User, Globe, DollarSign, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CURRENCIES } from '../utils/constants';

export default function SettingsPage() {
  const { user, setUser, currency, setCurrency, addToast } = useApp();

  /* Local state for form fields */
  const [profile, setProfile] = useState({
    name: user?.name || 'Demo User',
    email: user?.email || 'demo@example.com',
  });
  const [lang, setLang] = useState('en-IN');
  const [curr, setCurr] = useState(currency);

  const handleSave = () => {
    // Update global context
    if (user) {
      setUser({ ...user, name: profile.name, email: profile.email });
    }
    setCurrency(curr);
    
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Your preferences have been updated successfully.',
    });
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in-up">
      {/* Profile Section */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-indigo-500" />
          Profile Details
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-shadow"
            />
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-emerald-500" />
          Preferences
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-shadow bg-white"
            >
              <option value="en-IN">English (India)</option>
              <option value="en-US">English (US)</option>
              <option value="hi-IN">Hindi (India)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Base Currency</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={curr}
                onChange={(e) => setCurr(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-shadow bg-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
