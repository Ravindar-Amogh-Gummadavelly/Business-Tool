/**
 * HistoryPage.jsx
 * -------------------------------------------------
 * Full history view with:
 *  - Collapsible filters bar (date range, supplier, voucher, commodity)
 *  - Sortable results table with expandable row details
 *  - Pagination (15 per page)
 *  - Empty state
 */
import { useState, useCallback, useMemo, useEffect, Fragment } from 'react';
import {
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  FileText,
  Download,
  Upload,
} from 'lucide-react';
import Papa from 'papaparse';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { usePurchases } from '../hooks/usePurchases';
import { formatCurrency } from '../utils/formatters';

const PAGE_SIZE = 15;

/* ================================================================
   History Page
   ================================================================ */
export default function HistoryPage() {
  const navigate = useNavigate();
  const { currency } = useAppContext();
  const { purchases, loading } = usePurchases();
  const [searchParams] = useSearchParams();

  /* ---- Filter state ---- */
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    supplier: searchParams.get('supplier') || '',
    voucher: searchParams.get('voucher') || '',
    commodity: searchParams.get('product') || '',
  });

  /* ---- Sort state ---- */
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  /* ---- Pagination ---- */
  const [page, setPage] = useState(1);

  /* ---- Expanded rows ---- */
  const [expandedRow, setExpandedRow] = useState(null);

  /* ---- CSV Export / Import State ---- */
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCols, setExportCols] = useState({
    date: true,
    type: true,
    voucher: true,
    supplier: true,
    commodity: true,
    qty: true,
    unit: true,
    unitPrice: true,
    total: true,
  });

  const handleExport = () => {
    // Flatten data
    const flatData = [];
    filteredData.forEach(entry => {
      if (entry.items && entry.items.length > 0) {
        entry.items.forEach(item => {
          const row = {};
          if (exportCols.date) row['Date'] = entry.billingDate?.split('T')[0] || '';
          if (exportCols.type) row['Type'] = entry.entryType === 'Outward' ? 'Sale' : 'Purchase';
          if (exportCols.voucher) row['Voucher'] = entry.voucherNumber || '';
          if (exportCols.supplier) row['Supplier/Customer'] = entry.supplierName || '';
          if (exportCols.commodity) row['Commodity'] = item.commodity || '';
          if (exportCols.qty) row['Quantity'] = item.quantity || 0;
          if (exportCols.unit) row['Unit'] = item.unit || '';
          if (exportCols.unitPrice) row['Unit Price'] = item.unitPrice || 0;
          if (exportCols.total) row['Line Total'] = item.subtotal || 0;
          flatData.push(row);
        });
      } else {
        const row = {};
        if (exportCols.date) row['Date'] = entry.billingDate?.split('T')[0] || '';
        if (exportCols.type) row['Type'] = entry.entryType === 'Outward' ? 'Sale' : 'Purchase';
        if (exportCols.voucher) row['Voucher'] = entry.voucherNumber || '';
        if (exportCols.supplier) row['Supplier/Customer'] = entry.supplierName || '';
        if (exportCols.commodity) row['Commodity'] = 'No Items';
        if (exportCols.qty) row['Quantity'] = 0;
        if (exportCols.unit) row['Unit'] = '';
        if (exportCols.unitPrice) row['Unit Price'] = 0;
        if (exportCols.total) row['Line Total'] = 0;
        flatData.push(row);
      }
    });

    const csv = Papa.unparse(flatData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `purchases_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        // Here we would typically send to API
        // For now, we just notify
        alert(`Successfully parsed ${results.data.length} rows from CSV! (Mock Import)`);
      }
    });
    e.target.value = null; // Reset input
  };

  /* ---- Filter handlers ---- */
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ dateFrom: '', dateTo: '', supplier: '', voucher: '', commodity: '' });
    setPage(1);
  }, []);

  /* ---- Sort handler ---- */
  const handleSort = useCallback(
    (key) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
      setPage(1);
    },
    [sortKey]
  );

  /* ---- Sort icon ---- */
  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-500" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-500" />
    );
  };

  /* ---- Filtered + Sorted data ---- */
  const filteredData = useMemo(() => {
    let data = [...(purchases || [])];

    /* Apply filters */
    if (filters.dateFrom) {
      data = data.filter((p) => p.billingDate >= filters.dateFrom);
    }
    if (filters.dateTo) {
      data = data.filter((p) => p.billingDate <= filters.dateTo);
    }
    if (filters.supplier.trim()) {
      const q = filters.supplier.toLowerCase();
      data = data.filter((p) => (p.supplierName || '').toLowerCase().includes(q));
    }
    if (filters.voucher.trim()) {
      const q = filters.voucher.toLowerCase();
      data = data.filter((p) => (p.voucherNumber || '').toLowerCase().includes(q));
    }
    if (filters.commodity.trim()) {
      const q = filters.commodity.toLowerCase();
      data = data.filter((p) =>
        (p.items || []).some((it) => (it.commodity || '').toLowerCase().includes(q))
      );
    }

    /* Sort */
    data.sort((a, b) => {
      let va, vb;
      switch (sortKey) {
        case 'date':
          va = a.billingDate || '';
          vb = b.billingDate || '';
          break;
        case 'voucher':
          va = (a.voucherNumber || '').toLowerCase();
          vb = (b.voucherNumber || '').toLowerCase();
          break;
        case 'supplier':
          va = (a.supplierName || '').toLowerCase();
          vb = (b.supplierName || '').toLowerCase();
          break;
        case 'items':
          va = (a.items || []).length;
          vb = (b.items || []).length;
          break;
        case 'subtotal':
          va = a.productSubtotal || 0;
          vb = b.productSubtotal || 0;
          break;
        case 'logistics':
          va = a.logisticsCharges || 0;
          vb = b.logisticsCharges || 0;
          break;
        case 'total':
          va = a.grandTotal || 0;
          vb = b.grandTotal || 0;
          break;
        default:
          va = '';
          vb = '';
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [purchases, filters, sortKey, sortDir]);

  /* ---- Pagination derived values ---- */
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ---- Column header helper ---- */
  const renderColHeader = (label, columnKey, align = 'left') => (
    <th
      key={columnKey}
      className={`pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 transition-colors ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}
      onClick={() => handleSort(columnKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon columnKey={columnKey} />
      </span>
    </th>
  );

  /* ---- Format display date ---- */
  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      {/* ============ FILTERS BAR ============ */}
      <section id="filters-section" className="glass-card overflow-hidden">
        {/* Toggle header */}
        <button
          id="toggle-filters"
          type="button"
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/50 transition-colors"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-500" />
            Filters
          </span>
          {filtersOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Filter fields */}
        {filtersOpen && (
          <div className="px-6 pb-5 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Date From */}
              <div>
                <label htmlFor="filter-date-from" className="block text-xs font-medium text-slate-500 mb-1">
                  Date From
                </label>
                <input
                  id="filter-date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Date To */}
              <div>
                <label htmlFor="filter-date-to" className="block text-xs font-medium text-slate-500 mb-1">
                  Date To
                </label>
                <input
                  id="filter-date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Supplier */}
              <div>
                <label htmlFor="filter-supplier" className="block text-xs font-medium text-slate-500 mb-1">
                  Supplier
                </label>
                <input
                  id="filter-supplier"
                  type="text"
                  placeholder="Search supplier..."
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Voucher */}
              <div>
                <label htmlFor="filter-voucher" className="block text-xs font-medium text-slate-500 mb-1">
                  Voucher #
                </label>
                <input
                  id="filter-voucher"
                  type="text"
                  placeholder="Search voucher..."
                  value={filters.voucher}
                  onChange={(e) => handleFilterChange('voucher', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Commodity */}
              <div>
                <label htmlFor="filter-commodity" className="block text-xs font-medium text-slate-500 mb-1">
                  Commodity
                </label>
                <input
                  id="filter-commodity"
                  type="text"
                  placeholder="Search commodity..."
                  value={filters.commodity}
                  onChange={(e) => handleFilterChange('commodity', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Filter actions */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                id="clear-filters"
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
              <button
                id="search-filters"
                type="button"
                onClick={() => setPage(1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ============ RESULTS ============ */}
      <section id="results-section" className="glass-card p-6">
        {/* Entry count and Actions */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredData.length}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Empty state */}
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Package className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-500 mb-1">No entries found</p>
            <p className="text-sm">Try adjusting your filters or add a new entry.</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    {renderColHeader('Date', 'date')}
                    {renderColHeader('Voucher #', 'voucher')}
                    {renderColHeader('Type', 'entryType')}
                    {renderColHeader('Supplier / Customer', 'supplier')}
                    {renderColHeader('Items', 'items', 'center')}
                    {renderColHeader('Bill', 'bill', 'center')}
                    {renderColHeader('Product Subtotal', 'subtotal', 'right')}
                    {renderColHeader('Logistics', 'logistics', 'right')}
                    {renderColHeader('Grand Total', 'total', 'right')}
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedData.map((entry, i) => {
                    const isExpanded = expandedRow === entry.id;
                    const rowIndex = (page - 1) * PAGE_SIZE + i;
                    return (
                      <Fragment key={entry.id || rowIndex}>
                        {/* Main row */}
                        <tr
                          className={`border-b border-slate-100 cursor-pointer transition-colors
                            ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                            ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-indigo-50/30'}
                          `}
                          onClick={() => setExpandedRow(isExpanded ? null : entry.id)}
                        >
                          <td className="py-3 text-slate-600">{fmtDate(entry.billingDate)}</td>
                          <td className="py-3">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              {entry.voucherNumber}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${entry.entryType === 'Outward' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {entry.entryType === 'Outward' ? 'Sale' : 'Purchase'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600">{entry.supplierName || '—'}</td>
                          <td className="py-3 text-center text-slate-600">
                            {(entry.items || []).length}
                          </td>
                          <td className="py-3 text-center">
                            {entry.billUrl ? (
                              <a href={entry.billUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors" title="View Bill">
                                <FileText className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 text-right text-slate-700 font-medium">
                            {formatCurrency(entry.productSubtotal, currency)}
                          </td>
                          <td className="py-3 text-right text-slate-500">
                            {formatCurrency(entry.logisticsCharges, currency)}
                          </td>
                          <td className="py-3 text-right font-semibold text-slate-800">
                            {formatCurrency(entry.grandTotal, currency)}
                          </td>
                          <td className="py-3">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-indigo-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr className="bg-indigo-50/30">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="space-y-3">
                                {/* Items sub-table */}
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-indigo-100">
                                      <th className="text-left pb-2 text-xs font-semibold text-slate-500 uppercase">
                                        Commodity
                                      </th>
                                      <th className="text-right pb-2 text-xs font-semibold text-slate-500 uppercase">
                                        Qty
                                      </th>
                                      <th className="text-left pb-2 text-xs font-semibold text-slate-500 uppercase pl-3">
                                        Unit
                                      </th>
                                      <th className="text-right pb-2 text-xs font-semibold text-slate-500 uppercase">
                                        Price
                                      </th>
                                      <th className="text-right pb-2 text-xs font-semibold text-slate-500 uppercase">
                                        Subtotal
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(entry.items || []).map((item, j) => (
                                      <tr key={j} className="border-b border-indigo-50">
                                        <td className="py-2">
                                          <button
                                            onClick={() => navigate(`/inventory?search=${encodeURIComponent(item.commodity)}`)}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors text-left"
                                          >
                                            {item.commodity}
                                          </button>
                                        </td>
                                        <td className="py-2 text-right text-slate-600">
                                          {item.quantity}
                                        </td>
                                        <td className="py-2 text-slate-500 pl-3">{item.unit}</td>
                                        <td className="py-2 text-right text-slate-600">
                                          {formatCurrency(item.unitPrice, currency)}
                                        </td>
                                        <td className="py-2 text-right font-medium text-slate-700">
                                          {formatCurrency(item.subtotal, currency)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                                {/* Notes */}
                                {entry.notes && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-slate-600">{entry.notes}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ---- Pagination ---- */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    id="prev-page"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    id="next-page"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* CSV Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-500" />
                Export Data
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">Select the columns to include in your CSV export:</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.keys(exportCols).map((colKey) => (
                  <label key={colKey} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportCols[colKey]}
                      onChange={(e) => setExportCols({ ...exportCols, [colKey]: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="capitalize">{colKey.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

