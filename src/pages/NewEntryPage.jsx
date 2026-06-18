/**
 * NewEntryPage.jsx
 * -------------------------------------------------
 * Form page for adding a new stock inward entry.
 *
 * Sections:
 *  1. Header fields (billing date, voucher, supplier, logistics, notes)
 *  2. Dynamic items table (commodity, qty, unit, price, subtotal)
 *  3. Totals (product subtotal, logistics, grand total)
 *  4. Submit with validation, success modal
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  FileText,
  ArrowDownRight,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useInventory } from '../hooks/useInventory';
import { UNITS } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';
import { api } from '../services/api';

/* ---- Helper: today's date as YYYY-MM-DD ---- */
function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/* ---- Blank item row ---- */
function blankItem() {
  return { commodity: '', quantity: '', unit: 'pcs', unitPrice: '', subtotal: 0 };
}

/* ================================================================
   New Entry Page
   ================================================================ */
export default function NewEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currency } = useAppContext();
  const { inventory, loading: invLoading, addProduct } = useInventory();

  /* ---- Parse Query Params ---- */
  const initialType = searchParams.get('type') === 'OUT' ? 'Outward' : 'Inward';
  const initialProduct = searchParams.get('product') || '';

  /* ---- Form State ---- */
  const [form, setForm] = useState({
    entryType: initialType,
    billingDate: todayISO(),
    voucherNumber: '',
    supplierName: '',
    logisticsCharges: '',
    notes: '',
    billFile: null,
  });

  const [items, setItems] = useState(
    initialProduct ? [{ ...blankItem(), commodity: initialProduct }] : [blankItem()]
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  /* ---- Auto-fill initial product price when inventory loads ---- */
  useEffect(() => {
    if (!invLoading && initialProduct && items.length === 1 && !items[0].unitPrice) {
      const prod = inventory.find(p => p.name === initialProduct);
      if (prod) {
        setItems(prev => [{ ...prev[0], unitPrice: prod.defaultPrice }]);
      }
    }
  }, [invLoading, inventory, initialProduct, items]);


  /* ---- Quick Add Product State ---- */
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', defaultPrice: '' });

  /* ---- Handle header field change ---- */
  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  /* ---- Handle item field change ---- */
  const handleItemChange = useCallback((index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-fill price if commodity is selected
      if (field === 'commodity') {
        const prod = inventory.find(p => p.name === value);
        if (prod) {
          updated[index].unitPrice = prod.defaultPrice || '';
        }
      }
      
      /* Auto-calculate subtotal */
      const qty = parseFloat(updated[index].quantity) || 0;
      const price = parseFloat(updated[index].unitPrice) || 0;
      updated[index].subtotal = qty * price;
      return updated;
    });
    setErrors((prev) => ({ ...prev, [`item-${index}-${field}`]: undefined }));
  }, [inventory]);

  /* ---- Add / Remove rows ---- */
  const addRow = useCallback(() => {
    setItems((prev) => [...prev, blankItem()]);
  }, []);

  const removeRow = useCallback((index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ---- Computed totals ---- */
  const productSubtotal = useMemo(
    () => items.reduce((sum, it) => sum + (it.subtotal || 0), 0),
    [items]
  );
  const logistics = parseFloat(form.logisticsCharges) || 0;
  const grandTotal = productSubtotal + logistics;

  /* ---- Validation ---- */
  const validate = useCallback(() => {
    const errs = {};
    if (!form.billingDate) errs.billingDate = 'Date is required';
    if (!form.voucherNumber.trim()) errs.voucherNumber = 'Voucher number is required';

    items.forEach((item, i) => {
      if (!item.commodity.trim()) errs[`item-${i}-commodity`] = 'Required';
      if (!item.quantity || parseFloat(item.quantity) <= 0)
        errs[`item-${i}-quantity`] = 'Required';
      if (!item.unitPrice || parseFloat(item.unitPrice) <= 0)
        errs[`item-${i}-unitPrice`] = 'Required';
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, items]);

  /* ---- Submit ---- */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate()) return;

      setSubmitting(true);
      try {
        const payload = {
          entryType: form.entryType,
          billingDate: form.billingDate,
          voucherNumber: form.voucherNumber.trim(),
          supplierName: form.supplierName.trim(),
          logisticsCharges: logistics,
          notes: form.notes.trim(),
          billFile: form.billFile,
          items: items.map((it) => ({
            commodity: it.commodity.trim(),
            quantity: parseFloat(it.quantity),
            unit: it.unit,
            unitPrice: parseFloat(it.unitPrice),
            subtotal: it.subtotal,
          })),
          productSubtotal,
          grandTotal,
        };
        await api.addEntry(payload);
        setShowSuccess(true);
      } catch (err) {
        console.error('Submit error:', err);
        setErrors({ submit: 'Failed to save entry. Please try again.' });
      } finally {
        setSubmitting(false);
      }
    },
    [form, items, logistics, productSubtotal, grandTotal, validate]
  );

  /* ---- Reset form ---- */
  const resetForm = useCallback(() => {
    setForm({
      entryType: 'Inward',
      billingDate: todayISO(),
      voucherNumber: '',
      supplierName: '',
      logisticsCharges: '',
      notes: '',
      billFile: null,
    });
    setItems([blankItem()]);
    setErrors({});
    setShowSuccess(false);
  }, []);

  /* ---- Handle Add New Product on the fly ---- */
  const handleAddNewProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.defaultPrice) return;

    try {
      await addProduct({
        name: newProduct.name,
        defaultPrice: Number(newProduct.defaultPrice),
        minPrice: Number(newProduct.defaultPrice),
        maxPrice: Number(newProduct.defaultPrice),
      });
      setShowNewProduct(false);
      setNewProduct({ name: '', defaultPrice: '' });
    } catch (err) {
      console.error('Failed to add product:', err);
      alert('Failed to add product');
    }
  };

  /* ---- Input helper class ---- */
  const inputClass = (errKey) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
      errors[errKey]
        ? 'border-red-300 focus:ring-red-500/30 bg-red-50/50'
        : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white'
    }`;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        {/* ============ ENTRY TYPE TOGGLE ============ */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner">
            <button
              type="button"
              onClick={() => handleFieldChange('entryType', 'Inward')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${form.entryType === 'Inward' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Stock Inward (Purchase)
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange('entryType', 'Outward')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${form.entryType === 'Outward' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Stock Outward (Sale)
            </button>
          </div>
        </div>

        {/* ============ HEADER FIELDS ============ */}
        <section id="entry-header" className="glass-card p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-800 pb-3 mb-5 border-b border-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            Entry Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Billing Date */}
            <div>
              <label htmlFor="billing-date" className="block text-sm font-medium text-slate-600 mb-1.5">
                Billing Date <span className="text-red-500">*</span>
              </label>
              <input
                id="billing-date"
                type="date"
                value={form.billingDate}
                onChange={(e) => handleFieldChange('billingDate', e.target.value)}
                className={inputClass('billingDate')}
              />
              {errors.billingDate && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.billingDate}
                </p>
              )}
            </div>

            {/* Voucher Number */}
            <div>
              <label htmlFor="voucher-number" className="block text-sm font-medium text-slate-600 mb-1.5">
                Voucher Number <span className="text-red-500">*</span>
              </label>
              <input
                id="voucher-number"
                type="text"
                placeholder="e.g. INV-001"
                value={form.voucherNumber}
                onChange={(e) => handleFieldChange('voucherNumber', e.target.value)}
                className={inputClass('voucherNumber')}
              />
              {errors.voucherNumber && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.voucherNumber}
                </p>
              )}
            </div>

            {/* Supplier Name */}
            <div>
              <label htmlFor="supplier-name" className="block text-sm font-medium text-slate-600 mb-1.5">
                {form.entryType === 'Inward' ? 'Supplier Name' : 'Customer Name'}
              </label>
              <input
                id="supplier-name"
                type="text"
                placeholder="Optional"
                value={form.supplierName}
                onChange={(e) => handleFieldChange('supplierName', e.target.value)}
                className={inputClass()}
              />
            </div>

            {/* Logistics Charges */}
            <div>
              <label htmlFor="logistics-charges" className="block text-sm font-medium text-slate-600 mb-1.5">
                Logistics Charges
              </label>
              <input
                id="logistics-charges"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.logisticsCharges}
                onChange={(e) => handleFieldChange('logisticsCharges', e.target.value)}
                className={inputClass()}
              />
            </div>

            {/* Notes - full width */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label htmlFor="entry-notes" className="block text-sm font-medium text-slate-600 mb-1.5">
                Notes
              </label>
              <textarea
                id="entry-notes"
                rows={2}
                placeholder="Optional notes..."
                value={form.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                className={`${inputClass()} resize-none`}
              />
            </div>

            {/* Bill Attachment */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label htmlFor="bill-file" className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-2">
                Attach Bill <span className="text-xs font-normal text-slate-400">(Optional Image/PDF)</span>
              </label>
              <input
                id="bill-file"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFieldChange('billFile', e.target.files[0])}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* ============ ITEMS TABLE ============ */}
        <section id="items-table" className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-500" />
              Items
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewProduct(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
              >
                <Package className="w-4 h-4" />
                Add Product
              </button>
              <button
                id="add-item-row"
                type="button"
                onClick={addRow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Row
              </button>
            </div>
          </div>

          {/* Desktop table / Mobile cards */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider w-10">#</th>
                  <th className="text-left pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Commodity Name *</th>
                  <th className="text-left pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider w-28">Quantity *</th>
                  <th className="text-left pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider w-28">Unit</th>
                  <th className="text-left pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider w-32">Unit Price *</th>
                  <th className="text-right pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider w-32">Subtotal</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {/* Row number */}
                    <td className="py-3 text-slate-400 font-medium">{i + 1}</td>

                    {/* Commodity */}
                    <td className="py-3 pr-2">
                      <select
                        id={`item-commodity-${i}`}
                        value={item.commodity}
                        onChange={(e) => handleItemChange(i, 'commodity', e.target.value)}
                        className={`w-full px-2.5 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 bg-white ${
                          errors[`item-${i}-commodity`]
                            ? 'border-red-300 focus:ring-red-500/30'
                            : 'border-slate-200 focus:ring-indigo-500/30'
                        }`}
                      >
                        <option value="" disabled>Select Product...</option>
                        {invLoading ? (
                          <option value="" disabled>Loading...</option>
                        ) : (
                          inventory.map(prod => (
                            <option key={prod.id} value={prod.name}>
                              {prod.name} (Stock: {prod.stock})
                            </option>
                          ))
                        )}
                      </select>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 pr-2">
                      <input
                        id={`item-quantity-${i}`}
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                        className={`w-full px-2.5 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors[`item-${i}-quantity`]
                            ? 'border-red-300 focus:ring-red-500/30'
                            : 'border-slate-200 focus:ring-indigo-500/30'
                        }`}
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-3 pr-2">
                      <select
                        id={`item-unit-${i}`}
                        value={item.unit}
                        onChange={(e) => handleItemChange(i, 'unit', e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white cursor-pointer"
                      >
                        {UNITS.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 pr-2">
                      <input
                        id={`item-price-${i}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(i, 'unitPrice', e.target.value)}
                        className={`w-full px-2.5 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 ${
                          errors[`item-${i}-unitPrice`]
                            ? 'border-red-300 focus:ring-red-500/30'
                            : 'border-slate-200 focus:ring-indigo-500/30'
                        }`}
                      />
                    </td>

                    {/* Subtotal (read-only) */}
                    <td className="py-3 text-right font-semibold text-slate-700">
                      {formatCurrency(item.subtotal, currency)}
                    </td>

                    {/* Delete row */}
                    <td className="py-3 text-center">
                      {items.length > 1 && (
                        <button
                          id={`delete-item-${i}`}
                          type="button"
                          onClick={() => removeRow(i)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          aria-label={`Delete row ${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============ TOTALS SECTION ============ */}
        <section id="totals-section" className="glass-card p-6 mb-6">
          <div className="max-w-sm ml-auto space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Product Subtotal</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(productSubtotal, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Logistics Charges</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(logistics, currency)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <span className="text-base font-semibold text-slate-800">Grand Total</span>
              <span className="text-xl font-bold text-indigo-600">
                {formatCurrency(grandTotal, currency)}
              </span>
            </div>
          </div>
        </section>

        {/* ============ SUBMIT ============ */}
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errors.submit}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            id="reset-form"
            type="button"
            onClick={resetForm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            id="submit-entry"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg shadow-indigo-200 transition-colors"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </form>

      {/* ============ SUCCESS MODAL ============ */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            id="success-modal"
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in-up"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Entry Saved!</h3>
            <p className="text-sm text-slate-500 mb-6">
              Your stock inward entry has been saved successfully.
            </p>
            <div className="flex items-center gap-3 justify-center">
              <button
                id="add-another"
                onClick={resetForm}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Another
              </button>
              <button
                id="view-history"
                onClick={() => navigate('/history')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                View History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Product Modal */}
      {showNewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" />
                Quick Add Product
              </h3>
            </div>
            <form onSubmit={handleAddNewProduct} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                <input 
                  required 
                  type="text" 
                  value={newProduct.name} 
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/30 outline-none text-sm" 
                  placeholder="e.g. Rice Cooker Pro" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Default Unit Price *</label>
                <input 
                  required 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={newProduct.defaultPrice} 
                  onChange={(e) => setNewProduct({...newProduct, defaultPrice: e.target.value})} 
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/30 outline-none text-sm" 
                  placeholder="0.00" 
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowNewProduct(false)} className="w-1/2 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="w-1/2 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
