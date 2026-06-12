const BASE_URL = 'http://localhost:5005/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const api = {
  // Purchases
  async getPurchases() {
    const res = await fetch(`${BASE_URL}/purchases`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch purchases');
    const flatPurchases = await res.json();
    
    const headers = [];
    const items = [];
    
    flatPurchases.forEach(p => {
      let h = headers.find(x => x.Purchase_ID === p['Purchase ID']);
      if (!h) {
        h = {
          Purchase_ID: p['Purchase ID'],
          Date: p['Date'],
          Supplier: p['Supplier'],
          Grand_Total: 0,
          Status: 'Completed'
        };
        headers.push(h);
      }
      h.Grand_Total += Number(p['Amount']);
      
      items.push({
        Purchase_ID: p['Purchase ID'],
        Commodity: p['Product'],
        Quantity: Number(p['Quantity']),
        Unit: 'Unit',
        Unit_Price: Number(p['Amount']) / Number(p['Quantity']),
        Line_Total: Number(p['Amount'])
      });
    });
    
    return { success: true, data: { headers, items } };
  },
  async submitPurchase(data) {
    // The UI sends: { items: [{commodity, quantity, unitPrice}], supplierName }
    // We send one request per item to our flat backend
    const promises = data.items.map(item => {
      return fetch(`${BASE_URL}/purchases`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          supplierName: data.supplierName,
          product: item.commodity,
          quantity: item.quantity,
          purchasePrice: item.unitPrice,
          amountPaid: data.amountPaid || 0
        })
      });
    });
    await Promise.all(promises);
    return { success: true, data: { Purchase_ID: `PUR-${Date.now()}` } };
  },

  // Sales (Using same hook logic as purchases, assuming useSales exists or reusing usePurchases)
  async getSales() {
    const res = await fetch(`${BASE_URL}/sales`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch sales');
    const flatSales = await res.json();
    
    const headers = [];
    const items = [];
    
    flatSales.forEach(s => {
      let h = headers.find(x => x.Purchase_ID === s['Invoice ID']);
      if (!h) {
        h = {
          Purchase_ID: s['Invoice ID'],
          Date: s['Date'],
          Supplier: s['Customer'], // mapped to supplierName in UI
          Grand_Total: 0,
          Status: 'Completed'
        };
        headers.push(h);
      }
      h.Grand_Total += Number(s['Amount']);
      
      items.push({
        Purchase_ID: s['Invoice ID'],
        Commodity: s['Product'],
        Quantity: Number(s['Quantity']),
        Unit: 'Unit',
        Unit_Price: Number(s['Amount']) / Number(s['Quantity']),
        Line_Total: Number(s['Amount'])
      });
    });
    
    return { success: true, data: { headers, items } };
  },
  async submitSale(data) {
    const promises = data.items.map(item => {
      return fetch(`${BASE_URL}/sales`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          customerName: data.supplierName || data.customerName,
          product: item.commodity,
          quantity: item.quantity,
          sellingPrice: item.unitPrice,
          amountPaid: data.amountPaid || 0
        })
      });
    });
    await Promise.all(promises);
    return { success: true, data: { Invoice_ID: `INV-${Date.now()}` } };
  },

  // Products / Inventory
  async getInventory() {
    const res = await fetch(`${BASE_URL}/products`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch inventory');
    const prods = await res.json();
    
    const mapped = prods.map(p => ({
      id: p['Product ID'],
      name: p['Product Name'],
      category: p['Category'],
      defaultPrice: p['Selling Price'],
      stock: p['Quantity'],
      supplier: p['Supplier']
    }));
    return { success: true, data: mapped };
  },

  // Dashboard / Analytics / Ledger
  // Since we haven't built explicit endpoints for these yet, we will fallback to empty data for now, 
  // or you could build out those endpoints. For now, let's return minimal mock structure to avoid breaking the UI.
  async getDashboardData() {
    const res = await fetch(`${BASE_URL}/dashboard`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    const data = await res.json();
    return {
      success: true,
      data: data
    };
  },
  async getAnalytics() {
    return {
      success: true,
      data: {
        revenueByCommodity: [],
        dailyTrend: [],
        logisticsRatio: [],
        monthOverMonthChange: 0
      }
    };
  },
  async getLedgerData() {
    const res = await fetch(`${BASE_URL}/ledger`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch ledger data');
    const data = await res.json();
    return {
      success: true,
      data: data
    };
  }
};

export { api };
export default api;
