/**
 * LedgerPage.jsx
 * -------------------------------------------------
 * Cash book / Ledger tracking for sales, funds, and expenses.
 * Inspired by BI/Accounting apps like Tally.
 */

import { useState } from 'react';
import { useLedger } from '../hooks/useLedger';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { PlusCircle, Wallet, ArrowDownRight, ArrowUpRight, Search, FileText, Printer } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LedgerPage() {
  const { ledger, loading, addTransaction } = useLedger();
  const { currency } = useApp();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTxn, setNewTxn] = useState({ description: '', type: 'credit', amount: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTxn.amount || !newTxn.description) return;
    await addTransaction(newTxn);
    setShowModal(false);
    setNewTxn({ description: '', type: 'credit', amount: '' });
  };

  const filteredTxns = (ledger?.transactions || []).filter(t => 
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d) => {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const chartData = [...(ledger?.transactions || [])]
    .reverse()
    .map(t => ({
      date: new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      balance: t.balance,
    }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6 border-l-4 border-l-indigo-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Opening Balance</p>
          <p className="text-3xl font-bold text-slate-800">{formatCurrency(ledger.openingBalance, currency)}</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-emerald-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-slate-800">{formatCurrency(ledger.currentBalance, currency)}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-72 no-print">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto no-print">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors shadow-sm w-full sm:w-auto justify-center font-medium"
            >
              <Printer className="w-4 h-4" />
              Print Ledger
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto justify-center font-medium"
            >
              <PlusCircle className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Chart Section */}
        {!loading && chartData.length > 0 && (
          <div className="p-6 border-b border-slate-100 no-print">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Balance Trend</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} minTickGap={30} />
                  <YAxis hide domain={['dataMin - 10000', 'dataMax + 10000']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => formatCurrency(value, currency)}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 animate-pulse">Loading Ledger...</div>
          ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-3 px-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Date</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Description</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 uppercase tracking-wider text-xs">Debit (-)</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 uppercase tracking-wider text-xs">Credit (+)</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 uppercase tracking-wider text-xs">Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No transactions found.</td>
                  </tr>
                ) : (
                  filteredTxns.map((t) => (
                    <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{fmtDate(t.date)}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          {t.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600 font-medium">
                        {t.type === 'debit' ? (
                          <div className="flex items-center justify-end gap-1">
                            <ArrowDownRight className="w-3 h-3" />
                            {formatCurrency(t.amount, currency)}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                        {t.type === 'credit' ? (
                          <div className="flex items-center justify-end gap-1">
                            <ArrowUpRight className="w-3 h-3" />
                            {formatCurrency(t.amount, currency)}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-800 font-bold bg-slate-50/30">
                        {formatCurrency(t.balance, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-500" />
                New Transaction
              </h3>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer rounded-lg border p-3 flex items-center justify-center gap-2 font-medium transition-colors ${newTxn.type === 'credit' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <input type="radio" name="type" className="hidden" checked={newTxn.type === 'credit'} onChange={() => setNewTxn({...newTxn, type: 'credit'})} />
                    <ArrowUpRight className="w-4 h-4" /> Credit (In)
                  </label>
                  <label className={`cursor-pointer rounded-lg border p-3 flex items-center justify-center gap-2 font-medium transition-colors ${newTxn.type === 'debit' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <input type="radio" name="type" className="hidden" checked={newTxn.type === 'debit'} onChange={() => setNewTxn({...newTxn, type: 'debit'})} />
                    <ArrowDownRight className="w-4 h-4" /> Debit (Out)
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description / Particulars</label>
                <input required type="text" value={newTxn.description} onChange={(e) => setNewTxn({...newTxn, description: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/30 outline-none" placeholder="e.g. Daily Sales, Office Rent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input required type="number" min="1" step="0.01" value={newTxn.amount} onChange={(e) => setNewTxn({...newTxn, amount: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/30 outline-none" placeholder="0.00" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 py-2.5 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
