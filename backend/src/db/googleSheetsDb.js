const { google } = require('googleapis');
const clerk = require('@clerk/clerk-sdk-node');
const { Readable } = require('stream');

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Cache spreadsheet IDs for users
const userSheetCache = new Map();

/**
 * Retrieves the Google Access Token for a given user from Clerk.
 */
async function getGoogleAuthClient(userId) {
  try {
    const response = await clerk.users.getUserOauthAccessToken(userId, 'oauth_google');
    
    // Clerk returns an array of tokens. Sometimes it's directly an array, or an object with 'data'.
    const tokens = Array.isArray(response) ? response : (response.data || []);
    
    if (tokens.length === 0) {
      throw new Error("No Google OAuth token found. The user hasn't connected Google or the token expired.");
    }
    
    const token = tokens[0].token;
    
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: token });
    return authClient;
  } catch (error) {
    console.error("Error retrieving OAuth token from Clerk:", error);
    throw new Error("Failed to authenticate with Google APIs.");
  }
}

/**
 * Ensures the Google Sheet exists for the user. Creates it if it doesn't.
 */
async function ensureDatabaseExists(userId) {
  if (userSheetCache.has(userId)) {
    return userSheetCache.get(userId);
  }

  const auth = await getGoogleAuthClient(userId);
  const drive = google.drive({ version: 'v3', auth });
  
  // Search for the file
  const res = await drive.files.list({
    q: "name='StockFlow_AI_Database' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0) {
    const sheetId = res.data.files[0].id;
    userSheetCache.set(userId, sheetId);
    return sheetId;
  }

  // Create new Spreadsheet
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheet = await sheets.spreadsheets.create({
    resource: {
      properties: {
        title: 'StockFlow_AI_Database',
      },
      sheets: [
        { properties: { title: 'Customers' } },
        { properties: { title: 'Products' } },
        { properties: { title: 'Sales' } },
        { properties: { title: 'Purchases' } },
        { properties: { title: 'Expenses' } },
        { properties: { title: 'Suppliers' } },
        { properties: { title: 'Transactions' } }
      ]
    }
  });

  const newSheetId = spreadsheet.data.spreadsheetId;
  
  // Add headers to worksheets
  await initializeHeaders(sheets, newSheetId);
  
  userSheetCache.set(userId, newSheetId);
  return newSheetId;
}

async function initializeHeaders(sheets, spreadsheetId) {
  const headersMap = {
    'Customers': ['Customer ID', 'Name', 'Email', 'Phone', 'Address', 'Balance'],
    'Products': ['Product ID', 'Product Name', 'Category', 'Quantity', 'Selling Price', 'Supplier'],
    'Sales': ['Invoice ID', 'Date', 'Customer', 'Product', 'Quantity', 'Amount', 'Bill URL'],
    'Purchases': ['Purchase ID', 'Date', 'Supplier', 'Product', 'Quantity', 'Amount', 'Bill URL'],
    'Expenses': ['Expense ID', 'Date', 'Category', 'Description', 'Amount', 'Bill URL'],
    'Suppliers': ['Supplier ID', 'Name', 'Email', 'Phone', 'Address', 'Balance'],
    'Transactions': ['Transaction ID', 'Type', 'Amount', 'Date']
  };

  const requests = [];
  
  for (const [sheetName, headers] of Object.entries(headersMap)) {
    requests.push({
      range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
      values: [headers]
    });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data: requests
    }
  });
}

/**
 * Helper to execute sheets operations
 */
async function getSheetsInstance(userId) {
  const auth = await getGoogleAuthClient(userId);
  const spreadsheetId = await ensureDatabaseExists(userId);
  return {
    sheets: google.sheets({ version: 'v4', auth }),
    spreadsheetId
  };
}

/**
 * Read all rows from a table
 */
async function readTable(userId, tableName) {
  const { sheets, spreadsheetId } = await getSheetsInstance(userId);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tableName}!A:Z`
  });

  const rows = res.data.values;
  if (!rows || rows.length <= 1) return [];

  const headers = rows[0];
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    data.push(obj);
  }
  return data;
}

/**
 * Write an array of objects back to the table
 */
async function writeTable(userId, tableName, data) {
  const { sheets, spreadsheetId } = await getSheetsInstance(userId);
  
  // Get headers from first row
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tableName}!A1:Z1`
  });
  
  if (!headerRes.data.values || headerRes.data.values.length === 0) return;
  const headers = headerRes.data.values[0];
  
  const values = [headers];
  data.forEach(obj => {
    const row = headers.map(h => obj[h] || '');
    values.push(row);
  });

  // Clear existing
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tableName}!A2:Z`
  });

  // Write new
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tableName}!A1`,
    valueInputOption: 'USER_ENTERED',
    resource: { values }
  });
}

/**
 * Insert a single row into a table
 */
async function insertRow(userId, tableName, rowData) {
  const data = await readTable(userId, tableName);
  data.push(rowData);
  await writeTable(userId, tableName, data);
  return rowData;
}

/**
 * Update rows matching a condition
 */
async function updateRow(userId, tableName, predicate, updatedData) {
  const data = await readTable(userId, tableName);
  let updatedCount = 0;
  for (let i = 0; i < data.length; i++) {
    if (predicate(data[i])) {
      data[i] = { ...data[i], ...updatedData };
      updatedCount++;
    }
  }
  if (updatedCount > 0) {
    await writeTable(userId, tableName, data);
  }
  return updatedCount;
}

/**
 * Delete rows matching a condition
 */
async function deleteRow(userId, tableName, predicate) {
  const data = await readTable(userId, tableName);
  const filteredData = data.filter(row => !predicate(row));
  if (data.length !== filteredData.length) {
    await writeTable(userId, tableName, filteredData);
    return data.length - filteredData.length;
  }
  return 0;
}

async function uploadReceiptToDrive(userId, fileBuffer, fileName, mimeType) {
  const auth = await getGoogleAuthClient(userId);
  const drive = google.drive({ version: 'v3', auth });
  
  let folderId = null;
  const folderRes = await drive.files.list({
    q: "name='StockFlow_AI_Receipts' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (folderRes.data.files && folderRes.data.files.length > 0) {
    folderId = folderRes.data.files[0].id;
  } else {
    const newFolder = await drive.files.create({
      resource: {
        name: 'StockFlow_AI_Receipts',
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });
    folderId = newFolder.data.id;
  }

  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };
  const media = {
    mimeType: mimeType,
    body: bufferToStream(fileBuffer)
  };

  const uploadRes = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink'
  });

  return uploadRes.data.webViewLink;
}

module.exports = {
  ensureDatabaseExists,
  getSheetsInstance,
  readTable,
  writeTable,
  insertRow,
  updateRow,
  deleteRow,
  uploadReceiptToDrive
};
