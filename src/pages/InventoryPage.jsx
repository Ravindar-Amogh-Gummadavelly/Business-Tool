import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { useSearchParams } from 'react-router-dom';
import { Package, PlusCircle, Search, AlertTriangle, Archive, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InventoryPage() {
  const navigate = useNavigate();
  const { inventory, loading, addProduct } = useInventory();
  const { currency } = useApp();

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', defaultPrice: '', minPrice: '', maxPrice: '' });

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.defaultPrice) return;
    
    await addProduct({
      name: newProduct.name,
      defaultPrice: Number(newProduct.defaultPrice),
      minPrice: Number(newProduct.minPrice || newProduct.defaultPrice),
      maxPrice: Number(newProduct.maxPrice || newProduct.defaultPrice),
    });
    
    setShowModal(false);
    setNewProduct({ name: '', defaultPrice: '', minPrice: '', maxPrice: '' });
  };

  const getStockColor = (stock) => {
    if (stock <= 0) return 'text-red-600 bg-red-50';
    if (stock < 20) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 border-l-4 border-l-indigo-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Products Listed</p>
          <p className="text-3xl font-bold text-slate-800">{inventory.length}</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-emerald-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Items in Stock</p>
          <p className="text-3xl font-bold text-slate-800">
            {inventory.reduce((sum, item) => sum + Math.max(0, item.stock), 0)}
          </p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-rose-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Low/Out of Stock</p>
          <p className="text-3xl font-bold text-slate-800 text-rose-600">
            {inventory.filter(item => item.stock < 20).length}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products or IDs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto justify-center font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Product
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 animate-pulse">Loading Inventory...</div>
          ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-3 px-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Product ID</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Product Name</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 uppercase tracking-wider text-xs">Default Price</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 uppercase tracking-wider text-xs">Current Stock</th>
                  <th className="py-3 px-4 text-center font-semibold text-slate-500 uppercase tracking-wider text-xs w-32">Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      <Archive className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-indigo-600 font-medium whitespace-nowrap">{item.id}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          {item.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCurrency(item.defaultPrice, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={`px-2.5 py-1 rounded-full text-xs flex items-center justify-end gap-1.5 ml-auto w-fit ${getStockColor(item.stock)}`}>
                          {item.stock <= 0 && <AlertTriangle className="w-3 h-3" />}
                          {item.stock} Units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/new-entry?type=IN&product=${encodeURIComponent(item.name)}`)}
                            className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors tooltip-trigger"
                            title="Log Purchase"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/new-entry?type=OUT&product=${encodeURIComponent(item.name)}`)}
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors tooltip-trigger"
                            title="Log Sale"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />
                Add New Product
              </h3>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                <input 
                  required 
                  type="text" 
                  value={newProduct.name} 
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/30 outline-none" 
                  placeholder="e.g. Rice Cooker Pro" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Sales Price *</label>
                <input 
                  required 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={newProduct.defaultPrice} 
                  onChange={(e) => setNewProduct({...newProduct, defaultPrice: e.target.value})} 
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/30 outline-none" 
                  placeholder="0.00" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Price (Optional)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={newProduct.minPrice} 
                    onChange={(e) => setNewProduct({...newProduct, minPrice: e.target.value})} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/30 outline-none" 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Price (Optional)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={newProduct.maxPrice} 
                    onChange={(e) => setNewProduct({...newProduct, maxPrice: e.target.value})} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/30 outline-none" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 py-2.5 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
