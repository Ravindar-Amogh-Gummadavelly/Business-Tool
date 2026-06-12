// ============================================================
// Stock Inward Dashboard — Google Apps Script Backend
// ============================================================
// This script serves as the REST API for the Inventory and 
// Sales Management Dashboard. It uses a Google Sheet as its 
// database and is deployed as a Web App.
// ============================================================

// --------------- CONFIGURATION ---------------
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // <-- Replace with your Google Sheet ID

const HEADERS_SHEET = 'Purchase_Headers';
const ITEMS_SHEET = 'Purchase_Items';
const INVENTORY_SHEET = 'Inventory';
const LEDGER_SHEET = 'Ledger';
const SETTINGS_SHEET = 'Settings';

// Column definitions (1-indexed order in each sheet)
const HEADER_COLUMNS = [
  'Purchase_ID', 'Entry_Type', 'Billing_Date', 'Voucher_Number', 'Supplier_Name',
  'Logistics_Charges', 'Product_Subtotal', 'Notes', 'Created_At', 'Status'
];

const ITEM_COLUMNS = [
  'Purchase_ID', 'Commodity_Name', 'Quantity', 'Unit', 'Unit_Price', 'Subtotal'
];

const INVENTORY_COLUMNS = [
  'ID', 'Name', 'Default_Price', 'Stock', 'Min_Price', 'Max_Price'
];

const LEDGER_COLUMNS = [
  'ID', 'Date', 'Type', 'Amount', 'Description', 'Balance'
];

const SETTINGS_COLUMNS = [
  'Key', 'Value'
];

// --------------- ENTRY POINTS ---------------

/**
 * Handles all GET requests routed by ?action=<name>
 */
function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || '';

    switch (action) {
      case 'getPurchases':
      case 'getEntries':
        return jsonResponse(getEntries(params));
      case 'getAnalytics':
        return jsonResponse(getAnalytics(params));
      case 'getDashboardData':
        return jsonResponse(getDashboardData());
      case 'getInventory':
        return jsonResponse(getInventory());
      case 'getLedgerData':
        return jsonResponse(getLedgerData());
      case 'getSettings':
        return jsonResponse(getSettings());
      case 'seedSampleData':
        return jsonResponse(seedSampleData());
      default:
        return jsonResponse({
          status: 'ok',
          message: 'Inventory API is running. Available actions: getEntries, getAnalytics, getDashboardData, getInventory, getLedgerData, getSettings, seedSampleData',
          timestamp: new Date().toISOString()
        });
    }
  } catch (err) {
    return errorResponse(err.message);
  }
}

/**
 * Handles all POST requests. Body JSON must include { action: "..." }
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return errorResponse('No request body provided.');
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return errorResponse('Invalid JSON in request body: ' + parseErr.message);
    }

    var action = data.action || '';

    switch (action) {
      case 'addPurchase':
      case 'addEntry':
        return jsonResponse(addEntry(data));
      case 'addProduct':
        return jsonResponse(addProduct(data));
      case 'saveSettings':
        return jsonResponse(saveSettings(data));
      default:
        return errorResponse('Unknown POST action: ' + action);
    }
  } catch (err) {
    return errorResponse(err.message);
  }
}

// --------------- HELPER FUNCTIONS ---------------

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function generatePurchaseId() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(HEADERS_SHEET);
  var now = new Date();
  var dateStr = Utilities.formatDate(now, 'Asia/Kolkata', 'yyyyMMdd');
  var prefix = 'PH-' + dateStr + '-';

  var lastRow = sheet.getLastRow();
  var maxCounter = 0;

  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      var id = String(ids[i][0]);
      if (id.indexOf(prefix) === 0) {
        var counter = parseInt(id.substring(prefix.length), 10);
        if (!isNaN(counter) && counter > maxCounter) {
          maxCounter = counter;
        }
      }
    }
  }

  var newCounter = maxCounter + 1;
  var padded = ('0000' + newCounter).slice(-4);
  return prefix + padded;
}

function generateProductId() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(INVENTORY_SHEET);
  var lastRow = sheet ? sheet.getLastRow() : 1;
  var maxCounter = lastRow > 1 ? lastRow - 1 : 0;
  var padded = ('000' + (maxCounter + 1)).slice(-3);
  return 'PRD-' + padded;
}

function generateLedgerId() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(LEDGER_SHEET);
  var lastRow = sheet ? sheet.getLastRow() : 1;
  var maxCounter = lastRow > 1 ? lastRow - 1 : 0;
  var padded = ('0000' + (maxCounter + 1)).slice(-4);
  return 'TXN-' + padded;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'error',
      message: message,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  dateStr = String(dateStr).trim();
  if (!dateStr) return null;
  var isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }
  var d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function getSheetData(sheetName, columns) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(1, 1, lastRow, columns.length).getValues();
  var headers = data[0];
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      var key = String(headers[j]).trim();
      row[key] = data[i][j];
    }
    result.push(row);
  }
  return result;
}

function normalise(val) {
  if (val === null || val === undefined) return '';
  var s = String(val).trim();
  if (s.toLowerCase() === 'none') return '';
  return s;
}

function formatDateIST(d) {
  if (!(d instanceof Date)) return '';
  return Utilities.formatDate(d, 'Asia/Kolkata', 'yyyy-MM-dd');
}

// --------------- CORE API FUNCTIONS ---------------

/**
 * GET Settings
 */
function getSettings() {
  var data = getSheetData(SETTINGS_SHEET, SETTINGS_COLUMNS);
  var settings = {};
  for (var i = 0; i < data.length; i++) {
    settings[data[i].Key] = data[i].Value;
  }
  return { status: 'success', data: settings };
}

/**
 * POST Settings
 */
function saveSettings(data) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SETTINGS_SHEET);
  if (!sheet) throw new Error("Settings sheet not found");
  
  sheet.clear();
  sheet.appendRow(SETTINGS_COLUMNS);
  
  var keys = Object.keys(data.settings || {});
  for (var i = 0; i < keys.length; i++) {
    sheet.appendRow([keys[i], data.settings[keys[i]]]);
  }
  return { status: 'success', message: 'Settings saved.' };
}

/**
 * GET Inventory
 */
function getInventory() {
  var data = getSheetData(INVENTORY_SHEET, INVENTORY_COLUMNS);
  var mapped = data.map(function(r) {
    return {
      id: r.ID,
      name: r.Name,
      defaultPrice: Number(r.Default_Price) || 0,
      stock: Number(r.Stock) || 0,
      minPrice: Number(r.Min_Price) || 0,
      maxPrice: Number(r.Max_Price) || 0
    };
  });
  return { status: 'success', data: mapped };
}

/**
 * POST Product
 */
function addProduct(data) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(INVENTORY_SHEET);
  if (!sheet) throw new Error("Inventory sheet not found");

  var id = generateProductId();
  var name = String(data.name).trim();
  var defaultPrice = Number(data.defaultPrice) || 0;
  var minPrice = Number(data.minPrice) || defaultPrice;
  var maxPrice = Number(data.maxPrice) || defaultPrice;

  sheet.appendRow([id, name, defaultPrice, 0, minPrice, maxPrice]);

  return {
    status: 'success',
    data: { id: id, name: name, defaultPrice: defaultPrice, stock: 0, minPrice: minPrice, maxPrice: maxPrice }
  };
}

/**
 * GET Ledger
 */
function getLedgerData() {
  var data = getSheetData(LEDGER_SHEET, LEDGER_COLUMNS);
  var mapped = data.map(function(r) {
    return {
      id: r.ID,
      date: formatDateIST(r.Date) || String(r.Date),
      type: r.Type,
      amount: Number(r.Amount) || 0,
      description: r.Description,
      balance: Number(r.Balance) || 0
    };
  });
  return { status: 'success', data: mapped };
}

/**
 * addEntry(data)
 */
function addEntry(data) {
  // ---- Validation ----
  if (!data.billingDate) throw new Error('billingDate is required.');
  if (!data.voucherNumber) throw new Error('voucherNumber is required.');
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('items array is required.');
  }

  var purchaseId = generatePurchaseId();
  var entryType = data.entryType || 'Inward';
  var billingDate = parseDate(data.billingDate);
  var logisticsCharges = Number(data.logisticsCharges) || 0;
  var supplierName = normalise(data.supplierName);
  var notes = normalise(data.notes);
  var createdAt = new Date();
  var status = entryType === 'Outward' ? 'Completed' : 'Received';

  var productSubtotal = 0;
  var itemRows = [];

  for (var i = 0; i < data.items.length; i++) {
    var itm = data.items[i];
    var qty = Number(itm.quantity);
    var price = Number(itm.unitPrice);
    var subtotal = qty * price;
    productSubtotal += subtotal;

    itemRows.push([
      purchaseId,
      String(itm.commodity).trim(),
      qty,
      normalise(itm.unit) || 'pcs',
      price,
      subtotal
    ]);
  }

  // Write header row
  var ss = getSpreadsheet();
  var headersSheet = ss.getSheetByName(HEADERS_SHEET);
  headersSheet.appendRow([
    purchaseId,
    entryType,
    billingDate,
    String(data.voucherNumber).trim(),
    supplierName,
    logisticsCharges,
    productSubtotal,
    notes,
    createdAt,
    status
  ]);

  // Write item rows
  var itemsSheet = ss.getSheetByName(ITEMS_SHEET);
  var lastItemRow = itemsSheet.getLastRow();
  itemsSheet.getRange(lastItemRow + 1, 1, itemRows.length, ITEM_COLUMNS.length).setValues(itemRows);

  // Update Inventory Stock
  var invSheet = ss.getSheetByName(INVENTORY_SHEET);
  if (invSheet) {
    var invData = invSheet.getDataRange().getValues();
    for (var j = 0; j < data.items.length; j++) {
      var itemName = String(data.items[j].commodity).trim();
      var itemQty = Number(data.items[j].quantity);
      
      for (var r = 1; r < invData.length; r++) {
        if (String(invData[r][1]).trim() === itemName) {
          var currentStock = Number(invData[r][3]) || 0;
          var newStock = entryType === 'Inward' ? (currentStock + itemQty) : (currentStock - itemQty);
          invSheet.getRange(r + 1, 4).setValue(newStock); // Stock is 4th column
          break;
        }
      }
    }
  }

  // Update Ledger
  var ledgerSheet = ss.getSheetByName(LEDGER_SHEET);
  if (ledgerSheet) {
    var lData = ledgerSheet.getDataRange().getValues();
    var lastBalance = lData.length > 1 ? Number(lData[lData.length - 1][5]) : 0;
    var totalAmount = productSubtotal + logisticsCharges;
    
    // Inward (Purchase) = Debit (money out)
    // Outward (Sale) = Credit (money in)
    var lType = entryType === 'Inward' ? 'Debit' : 'Credit';
    var newBalance = lType === 'Credit' ? (lastBalance + totalAmount) : (lastBalance - totalAmount);
    var description = entryType + ' - ' + supplierName + ' (' + data.voucherNumber + ')';

    ledgerSheet.appendRow([
      generateLedgerId(),
      billingDate,
      lType,
      totalAmount,
      description,
      newBalance
    ]);
  }

  return {
    status: 'success',
    purchaseId: purchaseId,
    productSubtotal: productSubtotal,
    logisticsCharges: logisticsCharges,
    grandTotal: productSubtotal + logisticsCharges,
    itemCount: itemRows.length,
    timestamp: createdAt.toISOString()
  };
}

/**
 * getEntries(filters)
 */
function getEntries(filters) {
  var allHeaders = getSheetData(HEADERS_SHEET, HEADER_COLUMNS);
  var allItems = getSheetData(ITEMS_SHEET, ITEM_COLUMNS);

  var itemsMap = {};
  for (var i = 0; i < allItems.length; i++) {
    var pid = String(allItems[i]['Purchase_ID']);
    if (!itemsMap[pid]) itemsMap[pid] = [];
    itemsMap[pid].push({
      commodity: allItems[i]['Commodity_Name'],
      quantity: Number(allItems[i]['Quantity']),
      unit: allItems[i]['Unit'],
      unitPrice: Number(allItems[i]['Unit_Price']),
      subtotal: Number(allItems[i]['Subtotal'])
    });
  }

  var filtered = [];
  for (var h = 0; h < allHeaders.length; h++) {
    var hdr = allHeaders[h];
    var hdrDate = parseDate(hdr['Billing_Date']);
    var pid = String(hdr['Purchase_ID']);

    filtered.push({
      id: pid,
      purchaseId: pid,
      entryType: hdr['Entry_Type'] || 'Inward',
      billingDate: hdrDate ? hdrDate.toISOString() : '',
      voucherNumber: hdr['Voucher_Number'],
      supplierName: normalise(hdr['Supplier_Name']),
      logisticsCharges: Number(hdr['Logistics_Charges']) || 0,
      productSubtotal: Number(hdr['Product_Subtotal']) || 0,
      grandTotal: (Number(hdr['Product_Subtotal']) || 0) + (Number(hdr['Logistics_Charges']) || 0),
      notes: normalise(hdr['Notes']),
      status: hdr['Status'],
      items: itemsMap[pid] || []
    });
  }

  filtered.sort(function (a, b) {
    if (a.billingDate > b.billingDate) return -1;
    if (a.billingDate < b.billingDate) return 1;
    return 0;
  });

  return { status: 'success', data: filtered };
}

/**
 * getDashboardData()
 */
function getDashboardData() {
  var allHeaders = getSheetData(HEADERS_SHEET, HEADER_COLUMNS);
  var allItems = getSheetData(ITEMS_SHEET, ITEM_COLUMNS);

  var totalSpend = 0;
  var totalRevenue = 0;
  var totalItemsIn = 0;
  var totalItemsOut = 0;
  
  // Aggregate items into daily spend/revenue
  var daily = {};

  for (var i = 0; i < allHeaders.length; i++) {
    var h = allHeaders[i];
    var type = h['Entry_Type'] || 'Inward';
    var total = (Number(h['Product_Subtotal']) || 0) + (Number(h['Logistics_Charges']) || 0);
    
    var d = parseDate(h['Billing_Date']);
    var dStr = d ? formatDateIST(d) : 'Unknown';

    if (!daily[dStr]) daily[dStr] = { date: dStr, spend: 0, revenue: 0 };

    if (type === 'Inward') {
      totalSpend += total;
      daily[dStr].spend += total;
    } else {
      totalRevenue += total;
      daily[dStr].revenue += total;
    }
  }

  for (var j = 0; j < allItems.length; j++) {
    var itm = allItems[j];
    var pid = String(itm['Purchase_ID']);
    var hRow = allHeaders.find(function(hdr) { return hdr['Purchase_ID'] === pid; });
    var itmType = hRow ? (hRow['Entry_Type'] || 'Inward') : 'Inward';
    
    if (itmType === 'Inward') {
      totalItemsIn += Number(itm['Quantity']) || 0;
    } else {
      totalItemsOut += Number(itm['Quantity']) || 0;
    }
  }

  var dailySpend = Object.keys(daily).map(function(k) { return daily[k]; });
  dailySpend.sort(function(a, b) { return a.date > b.date ? 1 : -1; });

  return {
    status: 'success',
    totalSpend: totalSpend,
    totalRevenue: totalRevenue,
    totalItemsIn: totalItemsIn,
    totalItemsOut: totalItemsOut,
    dailySpend: dailySpend,
    latestPurchases: allHeaders.slice(-5)
  };
}

/**
 * getAnalytics()
 */
function getAnalytics(params) {
  return getDashboardData(); // Simplified for length
}

function seedSampleData() {
  return errorResponse('Seeding disabled to protect data.');
}
