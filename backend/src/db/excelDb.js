const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Table configurations
const TABLES = {
  Users: ['User ID', 'Name', 'Email', 'Password', 'Role'],
  Products: ['Product ID', 'Product Name', 'Category', 'Purchase Price', 'Selling Price', 'Quantity', 'Supplier'],
  Sales: ['Invoice ID', 'Customer', 'Product', 'Quantity', 'Amount', 'Date'],
  Purchases: ['Purchase ID', 'Supplier', 'Product', 'Quantity', 'Amount', 'Date'],
  Customers: ['Customer ID', 'Name', 'Contact', 'Balance'],
  Suppliers: ['Supplier ID', 'Name', 'Contact', 'Balance'],
  Transactions: ['Transaction ID', 'Type', 'Amount', 'Date']
};

/**
 * Get full file path for a table
 */
const getFilePath = (tableName) => path.join(DATA_DIR, `${tableName}.xlsx`);

/**
 * Initialize all tables if they don't exist
 */
const initDb = () => {
  for (const [tableName, columns] of Object.entries(TABLES)) {
    const filePath = getFilePath(tableName);
    if (!fs.existsSync(filePath)) {
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet([columns]);
      xlsx.utils.book_append_sheet(wb, ws, tableName);
      xlsx.writeFile(wb, filePath);
      console.log(`Initialized ${tableName}.xlsx`);
    }
  }
};

/**
 * Read all rows from a table
 */
const readTable = (tableName) => {
  const filePath = getFilePath(tableName);
  if (!fs.existsSync(filePath)) return [];
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[tableName];
  return xlsx.utils.sheet_to_json(ws);
};

/**
 * Write an array of objects back to the table
 */
const writeTable = (tableName, data) => {
  const filePath = getFilePath(tableName);
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(data, { header: TABLES[tableName] });
  xlsx.utils.book_append_sheet(wb, ws, tableName);
  xlsx.writeFile(wb, filePath);
};

/**
 * Insert a single row into a table
 */
const insertRow = (tableName, rowData) => {
  const data = readTable(tableName);
  data.push(rowData);
  writeTable(tableName, data);
  return rowData;
};

/**
 * Update rows matching a condition
 */
const updateRow = (tableName, predicate, updatedData) => {
  const data = readTable(tableName);
  let updatedCount = 0;
  for (let i = 0; i < data.length; i++) {
    if (predicate(data[i])) {
      data[i] = { ...data[i], ...updatedData };
      updatedCount++;
    }
  }
  if (updatedCount > 0) {
    writeTable(tableName, data);
  }
  return updatedCount;
};

/**
 * Delete rows matching a condition
 */
const deleteRow = (tableName, predicate) => {
  const data = readTable(tableName);
  const filteredData = data.filter((row) => !predicate(row));
  if (data.length !== filteredData.length) {
    writeTable(tableName, filteredData);
    return data.length - filteredData.length;
  }
  return 0;
};

// Auto-initialize DB on module load
initDb();

module.exports = {
  readTable,
  writeTable,
  insertRow,
  updateRow,
  deleteRow
};
