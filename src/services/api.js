const BASE_URL = 'http://localhost:5005/api';

const getHeaders = async () => {
  let token = null;
  if (window.Clerk && window.Clerk.session) {
    try {
      token = await window.Clerk.session.getToken();
    } catch (err) {
      console.warn("Failed to get Clerk token", err);
    }
  }
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const api = {
  // Purchases
  async getPurchases() {
    const headersObj = await getHeaders();
    const res = await fetch(`${BASE_URL}/purchases`, { headers: headersObj });
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
          Status: 'Completed',
          Bill_URL: p['Bill URL']
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
    const headersObj = await getHeaders();
    // The UI sends: { items: [{commodity, quantity, unitPrice}], supplierName }
    // We send one request per item to our flat backend
    const promises = data.items.map(item => {
      return fetch(`${BASE_URL}/purchases`, {
        method: 'POST',
        headers: headersObj,
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
    const headersObj = await getHeaders();
    const res = await fetch(`${BASE_URL}/sales`, { headers: headersObj });
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
          Status: 'Completed',
          Bill_URL: s['Bill URL']
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
    const headersObj = await getHeaders();
    const promises = data.items.map(item => {
      return fetch(`${BASE_URL}/sales`, {
        method: 'POST',
        headers: headersObj,
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
    const headersObj = await getHeaders();
    const res = await fetch(`${BASE_URL}/products`, { headers: headersObj });
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
    const headersObj = await getHeaders();
    const res = await fetch(`${BASE_URL}/dashboard`, { headers: headersObj });
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
    const headersObj = await getHeaders();
    const res = await fetch(`${BASE_URL}/ledger`, { headers: headersObj });
    if (!res.ok) throw new Error('Failed to fetch ledger data');
    const data = await res.json();
    return {
      success: true,
      data: data
    };
  },
  async addEntry(data) {
    const isSale = data.entryType === 'Outward';
    const endpoint = isSale ? `${BASE_URL}/sales` : `${BASE_URL}/purchases`;
    
    // We get headers but remove Content-Type so the browser can set boundary for FormData
    let token = null;
    if (window.Clerk && window.Clerk.session) {
      try { token = await window.Clerk.session.getToken(); } catch (err) {}
    }
    const fetchHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    // Map each item to a separate POST request, attaching the same billFile if it exists
    const promises = data.items.map(item => {
      const formData = new FormData();
      
      if (isSale) {
        formData.append('customerName', data.supplierName || 'Walk-in Customer');
        formData.append('product', item.commodity);
        formData.append('quantity', item.quantity);
        formData.append('sellingPrice', item.unitPrice);
        formData.append('amountPaid', data.amountPaid || 0); // Assuming amountPaid might be passed later
      } else {
        formData.append('supplierName', data.supplierName || 'Cash Supplier');
        formData.append('product', item.commodity);
        formData.append('quantity', item.quantity);
        formData.append('purchasePrice', item.unitPrice);
        formData.append('amountPaid', data.amountPaid || 0);
      }
      
      if (data.billFile) {
        formData.append('billFile', data.billFile);
      }

      return fetch(endpoint, {
        method: 'POST',
        headers: fetchHeaders,
        body: formData
      });
    });

    await Promise.all(promises);
    return { success: true };
  }
};

export { api };
export default api;
