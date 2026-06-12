# API Documentation

> REST API reference for the Stock Inward Dashboard backend (Google Apps Script).

---

## Base URL

```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

Replace `{DEPLOYMENT_ID}` with your actual deployment ID from Google Apps Script.

---

## Authentication Model

| Aspect | Detail |
|--------|--------|
| **Auth Type** | None (public API) |
| **Access** | Anyone with the URL |
| **Data Owner** | The Google account that deployed the script |
| **CORS** | Handled automatically by Apps Script |

> The API is public but the underlying Google Sheet is private. Only the deploying account can view/edit the sheet directly.

---

## Request Format

### GET Requests

Pass parameters as URL query strings:

```
GET {BASE_URL}?action=getPurchases&dateFrom=2026-05-01&dateTo=2026-05-23
```

### POST Requests

Send JSON in the request body:

```javascript
fetch(BASE_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'addPurchase',
    billingDate: '2026-05-23',
    voucherNumber: 'VCH-001',
    items: [...]
  })
});
```

> **Important:** Do NOT set `Content-Type` headers. Google Apps Script handles this automatically. Setting headers may cause CORS issues.

---

## Response Format

All responses are JSON with Content-Type `application/json`.

### Success Response

```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2026-05-23T12:00:00.000Z"
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Description of what went wrong",
  "timestamp": "2026-05-23T12:00:00.000Z"
}
```

---

## Endpoints

### 1. GET — Health Check (Default)

Returns API status when no action is specified.

**Request:**
```
GET {BASE_URL}
```

**Response:**
```json
{
  "status": "ok",
  "message": "Stock Inward Dashboard API is running. Available actions: getPurchases, getAnalytics, getDashboardData, seedSampleData",
  "timestamp": "2026-05-23T06:30:00.000Z"
}
```

---

### 2. POST — Add Purchase

Creates a new purchase entry with header and line items.

**Request:**
```
POST {BASE_URL}
```

**Body:**
```json
{
  "action": "addPurchase",
  "billingDate": "2026-05-23",
  "voucherNumber": "VCH-2026-0050",
  "supplierName": "Sharma Kitchen Appliances",
  "logisticsCharges": 750,
  "notes": "Urgent delivery for weekend stock",
  "items": [
    {
      "commodityName": "Roti Maker Basic",
      "quantity": 20,
      "unit": "pcs",
      "unitPrice": 500
    },
    {
      "commodityName": "Roti Maker Premium",
      "quantity": 10,
      "unit": "pcs",
      "unitPrice": 950
    }
  ]
}
```

**Required Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `action` | string | Must be `"addPurchase"` |
| `billingDate` | string | Date in YYYY-MM-DD format |
| `voucherNumber` | string | Unique voucher/invoice number |
| `items` | array | At least one item object |
| `items[].commodityName` | string | Name of the commodity |
| `items[].quantity` | number | Positive quantity |
| `items[].unitPrice` | number | Non-negative price per unit |

**Optional Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `supplierName` | string | `""` | Supplier name (accepts blank, "None") |
| `logisticsCharges` | number | `0` | Transport/logistics cost |
| `notes` | string | `""` | Additional notes |
| `items[].unit` | string | `"pcs"` | Unit of measurement |

**Success Response:**
```json
{
  "status": "success",
  "purchaseId": "PH-20260523-0001",
  "productSubtotal": 19500,
  "logisticsCharges": 750,
  "grandTotal": 20250,
  "itemCount": 2,
  "timestamp": "2026-05-23T06:30:00.000Z"
}
```

**Error Responses:**

| Error | Cause |
|-------|-------|
| `"billingDate is required."` | Missing billing date |
| `"voucherNumber is required."` | Missing voucher number |
| `"items array with at least one item is required."` | Empty or missing items |
| `"items[0].commodityName is required."` | Missing commodity name in item |
| `"items[0].quantity must be a positive number."` | Invalid quantity |
| `"items[0].unitPrice must be a non-negative number."` | Invalid price |
| `"Invalid billingDate format. Use YYYY-MM-DD."` | Unparseable date |

---

### 3. GET — Get Purchases

Retrieves purchase entries with optional filters and pagination.

**Request:**
```
GET {BASE_URL}?action=getPurchases&dateFrom=2026-05-01&dateTo=2026-05-23&supplier=sharma&page=1&limit=10
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | ✅ | Must be `"getPurchases"` |
| `dateFrom` | string | ❌ | Start date (YYYY-MM-DD), inclusive |
| `dateTo` | string | ❌ | End date (YYYY-MM-DD), inclusive |
| `supplier` | string | ❌ | Partial match, case-insensitive |
| `voucherNumber` | string | ❌ | Exact match |
| `commodity` | string | ❌ | Partial match on item commodity names |
| `page` | number | ❌ | Page number, default 1 |
| `limit` | number | ❌ | Items per page, default 50, max 200 |

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "purchaseId": "PH-20260523-0001",
      "billingDate": "2026-05-23",
      "voucherNumber": "VCH-2026-0050",
      "supplierName": "Sharma Kitchen Appliances",
      "logisticsCharges": 750,
      "productSubtotal": 19500,
      "grandTotal": 20250,
      "notes": "Urgent delivery for weekend stock",
      "createdAt": "2026-05-23T06:30:00.000Z",
      "items": [
        {
          "commodityName": "Roti Maker Basic",
          "quantity": 20,
          "unit": "pcs",
          "unitPrice": 500,
          "subtotal": 10000
        },
        {
          "commodityName": "Roti Maker Premium",
          "quantity": 10,
          "unit": "pcs",
          "unitPrice": 950,
          "subtotal": 9500
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 28,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 4. GET — Get Analytics

Returns aggregated analytics data for the specified period.

**Request:**
```
GET {BASE_URL}?action=getAnalytics&period=weekly
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | ✅ | Must be `"getAnalytics"` |
| `period` | string | ❌ | `"daily"`, `"weekly"` (default), or `"monthly"` |

#### Daily Analytics Response

```json
{
  "status": "success",
  "period": "daily",
  "date": "2026-05-23",
  "summary": {
    "totalEntries": 2,
    "totalProductValue": 25000,
    "totalLogistics": 1150,
    "grandTotal": 26150
  },
  "commodityBreakdown": [
    { "name": "Roti Maker Basic", "quantity": 30, "value": 15000 },
    { "name": "Roti Maker Premium", "quantity": 8, "value": 7600 }
  ]
}
```

#### Weekly Analytics Response

```json
{
  "status": "success",
  "period": "weekly",
  "dateRange": { "from": "2026-05-17", "to": "2026-05-23" },
  "summary": {
    "totalEntries": 11,
    "totalProductValue": 185000,
    "totalLogistics": 7050,
    "grandTotal": 192050
  },
  "dailyData": [
    {
      "date": "2026-05-17",
      "productValue": 10000,
      "logistics": 500,
      "total": 10500,
      "entries": 1,
      "commodities": [
        { "name": "Roti Maker Basic", "quantity": 20, "value": 10000 }
      ]
    }
  ],
  "topCommodities": [
    { "name": "Roti Maker Basic", "quantity": 150, "value": 75000 },
    { "name": "Roti Maker Premium", "quantity": 65, "value": 61750 }
  ]
}
```

#### Monthly Analytics Response

```json
{
  "status": "success",
  "period": "monthly",
  "month": "May 2026",
  "dateRange": { "from": "2026-05-01", "to": "2026-05-31" },
  "summary": {
    "totalEntries": 28,
    "totalProductValue": 450000,
    "totalLogistics": 21500,
    "grandTotal": 471500
  },
  "previousMonth": {
    "totalEntries": 25,
    "totalProductValue": 410000,
    "totalLogistics": 19000,
    "grandTotal": 429000
  },
  "monthOverMonthChange": {
    "absoluteChange": 42500,
    "percentChange": 9.91
  },
  "dailyData": [
    { "date": "2026-05-01", "productValue": 15000, "logistics": 800, "total": 15800, "entries": 2 }
  ],
  "commodityPie": [
    { "name": "Roti Maker Basic", "quantity": 380, "value": 190000 },
    { "name": "Roti Maker Premium", "quantity": 160, "value": 152000 }
  ],
  "supplierBreakdown": [
    { "name": "Sharma Kitchen Appliances", "entries": 6, "productValue": 85000, "logistics": 5200, "total": 90200 },
    { "name": "Gupta Manufacturing Co.", "entries": 5, "productValue": 72000, "logistics": 4850, "total": 76850 }
  ]
}
```

---

### 5. GET — Get Dashboard Data

Returns a combined payload optimised for the dashboard home page. This is the primary endpoint the frontend calls on load.

**Request:**
```
GET {BASE_URL}?action=getDashboardData
```

**Response:**
```json
{
  "status": "success",
  "timestamp": "2026-05-23T06:30:00.000Z",
  "today": {
    "date": "2026-05-23",
    "inwardValue": 25000,
    "logisticsCharges": 1150,
    "grandTotal": 26150,
    "entries": 2
  },
  "weekly": {
    "total": 192050,
    "trend": [
      { "date": "2026-05-17", "value": 10500 },
      { "date": "2026-05-18", "value": 18200 },
      { "date": "2026-05-19", "value": 15600 },
      { "date": "2026-05-20", "value": 22800 },
      { "date": "2026-05-21", "value": 45350 },
      { "date": "2026-05-22", "value": 53450 },
      { "date": "2026-05-23", "value": 26150 }
    ]
  },
  "monthly": {
    "total": 471500,
    "trend": [
      { "date": "2026-05-01", "value": 15800 },
      { "date": "2026-05-02", "value": 0 },
      { "date": "2026-05-03", "value": 22400 }
    ]
  },
  "recentEntries": [
    {
      "purchaseId": "PH-20260523-0001",
      "billingDate": "2026-05-23",
      "voucherNumber": "VCH-2026-0050",
      "supplierName": "Sharma Kitchen Appliances",
      "logisticsCharges": 750,
      "productSubtotal": 19500,
      "grandTotal": 20250,
      "notes": "Urgent delivery",
      "items": [
        { "commodityName": "Roti Maker Basic", "quantity": 20, "unit": "pcs", "unitPrice": 500, "subtotal": 10000 }
      ]
    }
  ],
  "commodityStats": [
    { "name": "Roti Maker Basic", "totalQuantity": 450, "totalValue": 225000 },
    { "name": "Roti Maker Premium", "totalQuantity": 190, "totalValue": 180500 }
  ],
  "totalPurchases": 28
}
```

---

### 6. GET — Seed Sample Data

Populates the database with 28 realistic sample entries for testing. **Clears all existing data first.**

**Request:**
```
GET {BASE_URL}?action=seedSampleData
```

**Response:**
```json
{
  "status": "success",
  "message": "Sample data seeded successfully.",
  "entriesCreated": 28,
  "itemRowsCreated": 44,
  "dateRange": {
    "from": "2026-04-23",
    "to": "2026-05-23"
  }
}
```

> ⚠️ **Warning:** This action deletes all existing data before inserting sample data.

---

## Error Codes

All errors return HTTP 200 (Google Apps Script limitation) with an error JSON body.

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `No request body provided.` | POST without body | Include JSON body |
| `Invalid JSON in request body` | Malformed JSON | Check JSON syntax |
| `Unknown POST action: xyz` | Invalid action | Use `addPurchase` |
| `billingDate is required.` | Missing field | Include billingDate |
| `voucherNumber is required.` | Missing field | Include voucherNumber |
| `items array with at least one item is required.` | Empty items | Include items array |
| `items[N].commodityName is required.` | Item missing name | Add commodityName |
| `items[N].quantity must be a positive number.` | Bad quantity | Use positive number |
| `items[N].unitPrice must be a non-negative number.` | Bad price | Use >= 0 number |
| `Invalid billingDate format.` | Bad date | Use YYYY-MM-DD |

---

## Rate Limits

Google Apps Script enforces these quotas:

| Limit | Value |
|-------|-------|
| Executions per day | 20,000 (consumer account) |
| Execution time per call | 6 minutes max |
| Simultaneous executions | 30 |
| URL Fetch calls per day | 20,000 |
| Spreadsheet read/write | ~100 requests/100s/user |

For typical dashboard usage (< 5,000 rows, < 100 requests/hour), you will not hit these limits.

---

## CORS Notes

### How it works

Google Apps Script web apps deployed with "Anyone" access automatically handle CORS. The response `Content-Type` is `application/json` (via `ContentService.MimeType.JSON`).

### Frontend Fetch Example (Recommended)

```javascript
// GET request
const response = await fetch(
  `${BASE_URL}?action=getDashboardData`
);
const data = await response.json();

// POST request
const response = await fetch(BASE_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'addPurchase',
    billingDate: '2026-05-23',
    voucherNumber: 'VCH-001',
    items: [{ commodityName: 'Roti Maker Basic', quantity: 10, unitPrice: 500 }]
  })
});
const data = await response.json();
```

### Important: Google Apps Script Redirect

Google Apps Script responds with a **302 redirect** to the actual response. The `fetch()` API follows redirects automatically, but:

- **DO NOT** set `mode: 'cors'` explicitly — it may break redirect following.
- **DO NOT** set `Content-Type` headers on GET requests.
- If you must handle redirects manually, follow the `Location` header.

### Axios Configuration

If using Axios:

```javascript
const response = await axios.get(BASE_URL, {
  params: { action: 'getDashboardData' }
});

const response = await axios.post(BASE_URL, {
  action: 'addPurchase',
  // ... data
}, {
  headers: {} // empty headers — let browser handle Content-Type
});
```

---

## Data Types Reference

### Purchase Header

| Field | Type | Example |
|-------|------|---------|
| purchaseId | string | `"PH-20260523-0001"` |
| billingDate | string (YYYY-MM-DD) | `"2026-05-23"` |
| voucherNumber | string | `"VCH-2026-0050"` |
| supplierName | string | `"Sharma Kitchen Appliances"` |
| logisticsCharges | number | `750` |
| productSubtotal | number | `19500` |
| grandTotal | number | `20250` |
| notes | string | `"Urgent delivery"` |
| createdAt | string (ISO 8601) | `"2026-05-23T06:30:00.000Z"` |

### Purchase Item

| Field | Type | Example |
|-------|------|---------|
| commodityName | string | `"Roti Maker Basic"` |
| quantity | number | `20` |
| unit | string | `"pcs"` |
| unitPrice | number | `500` |
| subtotal | number | `10000` |
