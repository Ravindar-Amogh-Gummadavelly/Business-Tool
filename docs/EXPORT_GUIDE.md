# Data Export Guide

> How to export, share, and create reports from your Stock Inward Dashboard data in Google Sheets.

---

## Table of Contents

1. [Understanding the Data Structure](#understanding-the-data-structure)
2. [Download as Excel (.xlsx)](#download-as-excel)
3. [Download as CSV](#download-as-csv)
4. [Share via Google Sheets](#share-via-google-sheets)
5. [Data Structure for Accountants / CAs](#data-structure-for-accountants)
6. [Creating Reports from the Data](#creating-reports)
7. [Tips and Best Practices](#tips-and-best-practices)

---

## Understanding the Data Structure

Your Stock Inward Dashboard stores data in two sheets within a single Google Spreadsheet:

### Sheet 1: Purchase_Headers

This is the **master record** for each purchase/inward entry.

| Column | Description | Example |
|--------|-------------|---------|
| Purchase_ID | Unique identifier (auto-generated) | `PH-20260523-0001` |
| Billing_Date | Date of the purchase/invoice | `2026-05-23` |
| Voucher_Number | Invoice or voucher reference | `VCH-2026-0050` |
| Supplier_Name | Name of the supplier (may be blank) | `Sharma Kitchen Appliances` |
| Logistics_Charges | Transport/freight charges (₹) | `750` |
| Product_Subtotal | Total value of all items (₹) | `19500` |
| Notes | Optional remarks | `Urgent delivery` |
| Created_At | Timestamp when the entry was recorded | `2026-05-23 12:00:00` |

### Sheet 2: Purchase_Items

This contains the **line items** (individual products) for each purchase.

| Column | Description | Example |
|--------|-------------|---------|
| Purchase_ID | Links to the header (foreign key) | `PH-20260523-0001` |
| Commodity_Name | Name of the product | `Roti Maker Basic` |
| Quantity | Number of units received | `20` |
| Unit | Unit of measurement | `pcs` |
| Unit_Price | Price per unit (₹) | `500` |
| Subtotal | Quantity × Unit Price (₹) | `10000` |

### How They Connect

Each `Purchase_ID` in the headers sheet can have **one or more items** in the items sheet. This is a standard one-to-many relationship.

```
Purchase_Headers (1)  ──→  Purchase_Items (many)
   PH-20260523-0001  ──→  Roti Maker Basic × 20
                      ──→  Roti Maker Premium × 10
```

---

## Download as Excel

Excel format (.xlsx) preserves formatting, formulas, and multiple sheets.

### Download Entire Workbook

1. Open your Google Sheet.
2. Go to **File → Download → Microsoft Excel (.xlsx)**.
3. The file downloads with both sheets intact.

### Download a Single Sheet

1. Right-click the sheet tab (e.g., `Purchase_Headers`).
2. Select **Copy to → New spreadsheet**.
3. Open the new spreadsheet.
4. Go to **File → Download → Microsoft Excel (.xlsx)**.

### Best For

- Sharing with accountants who use Excel/Tally
- Offline analysis
- Archival copies

---

## Download as CSV

CSV format is universally compatible but only supports one sheet at a time.

### Steps

1. Open your Google Sheet.
2. Select the sheet tab you want to export (e.g., `Purchase_Headers`).
3. Go to **File → Download → Comma-separated values (.csv)**.
4. Repeat for `Purchase_Items` if needed.

### Best For

- Importing into accounting software (Tally, Zoho Books, etc.)
- Data analysis in Python/R
- Bulk data processing

### CSV Encoding Note

Google Sheets exports CSV in UTF-8 encoding. If you see garbled characters (especially ₹ symbol) in Excel:
1. Open Excel → **Data → From Text/CSV**.
2. Select the file.
3. Choose **UTF-8** encoding.
4. Click **Load**.

---

## Share via Google Sheets

### Share with Specific People

1. Click the **Share** button (top-right).
2. Enter the email address of your accountant/CA.
3. Set permission:
   - **Viewer** — can only see data (recommended for CAs)
   - **Commenter** — can see and add comments
   - **Editor** — can modify data (use with caution)
4. Click **Send**.

### Share via Link

1. Click **Share → Copy link**.
2. Under "General access":
   - **Restricted** — only people you've shared with
   - **Anyone with the link** — anyone who has the URL
3. Set the role (Viewer/Commenter/Editor).
4. Send the link to your recipient.

### Share a Filtered View

Create a custom view for your CA without affecting the main sheet:

1. Go to **Data → Create a filter**.
2. Apply the filters (e.g., date range, supplier).
3. Go to **Data → Filter views → Save as filter view**.
4. Name it (e.g., "May 2026 — For CA").
5. Share the sheet — the CA can select this filter view from the Data menu.

---

## Data Structure for Accountants

This section explains the data in accounting terms, suitable for sharing with your CA or accountant.

### For the Accountant: How to Read This Data

**Purchase_Headers** is your **Purchase Register** or **Stock Inward Register**:

| Your Column | Accounting Term | Notes |
|-------------|----------------|-------|
| Purchase_ID | Reference Number | Auto-generated, unique per entry |
| Billing_Date | Invoice Date | The date on the supplier's bill/invoice |
| Voucher_Number | Invoice Number | The supplier's invoice/voucher number |
| Supplier_Name | Vendor/Party Name | May be blank for walk-in suppliers |
| Logistics_Charges | Freight Inward / Carriage Inward | Transportation cost — treated separately from product cost |
| Product_Subtotal | Gross Purchase Amount | Sum of all item values (before logistics) |
| Notes | Narration/Remarks | Free-text field for context |

**Purchase_Items** is your **Item-wise Purchase Detail**:

| Your Column | Accounting Term | Notes |
|-------------|----------------|-------|
| Purchase_ID | Reference Number | Links to the master entry |
| Commodity_Name | Item/Product Description | e.g., "Roti Maker Basic" |
| Quantity | Qty Received | Number of units |
| Unit | UOM (Unit of Measure) | Usually "pcs" |
| Unit_Price | Rate per Unit | Purchase price per piece |
| Subtotal | Amount (Qty × Rate) | Line-item total |

### Key Calculations

```
For each Purchase Entry:
  Product Subtotal = Sum of all Item Subtotals
  Grand Total = Product Subtotal + Logistics Charges

Total Purchase Value = Sum of all Grand Totals
Total Logistics = Sum of all Logistics Charges
Total Product Value = Sum of all Product Subtotals
```

### Tally Import Format

If your CA uses Tally, they can import the CSV data. The recommended mapping:

| CSV Column | Tally Field |
|------------|-------------|
| Billing_Date | Date |
| Voucher_Number | Ref. No. |
| Supplier_Name | Party A/c Name |
| Product_Subtotal | Purchase A/c (Dr.) |
| Logistics_Charges | Freight Inward A/c (Dr.) |
| Total (computed) | Sundry Creditors (Cr.) |

---

## Creating Reports

### Report 1: Monthly Purchase Summary

Use Google Sheets' built-in tools:

1. Select all data in `Purchase_Headers`.
2. Go to **Insert → Pivot table**.
3. Configure:
   - **Rows:** Billing_Date (group by Month)
   - **Values:** Product_Subtotal (SUM), Logistics_Charges (SUM)
4. You now have a monthly summary table.

### Report 2: Supplier-wise Breakdown

1. Create a pivot table from `Purchase_Headers`.
2. Configure:
   - **Rows:** Supplier_Name
   - **Values:** Product_Subtotal (SUM), Logistics_Charges (SUM), Purchase_ID (COUNTA for count)
3. Sort by total descending.

### Report 3: Commodity-wise Stock Register

1. Create a pivot table from `Purchase_Items`.
2. Configure:
   - **Rows:** Commodity_Name
   - **Values:** Quantity (SUM), Subtotal (SUM)
3. Add **Columns:** group Billing_Date by Month for monthly breakdown.

### Report 4: Daily Inward Register

This is the most common report for inventory management:

1. In `Purchase_Headers`, sort by Billing_Date.
2. Use **Data → Create a filter** to filter by date range.
3. The sheet becomes your Daily Inward Register.

### Report 5: Logistics Cost Analysis

1. Create a pivot table from `Purchase_Headers`.
2. Configure:
   - **Rows:** Supplier_Name
   - **Values:** Logistics_Charges (SUM), Logistics_Charges (AVERAGE)
3. Add a calculated field: `Logistics_Charges / Product_Subtotal × 100` for logistics percentage.

### Using VLOOKUP to Join Sheets

To create a combined view in a new sheet:

```
=VLOOKUP(A2, Purchase_Headers!A:H, 4, FALSE)
```

This looks up the Supplier_Name (column 4) for a given Purchase_ID.

### Using QUERY for Advanced Reports

```
=QUERY(Purchase_Headers!A:H, "SELECT B, D, SUM(F), SUM(E) WHERE B >= date '2026-05-01' GROUP BY B, D ORDER BY B DESC LABEL SUM(F) 'Total Products', SUM(E) 'Total Logistics'")
```

---

## Tips and Best Practices

### Do's

- ✅ **Download Excel/CSV backups** at least monthly
- ✅ **Share as Viewer** with your CA — they don't need edit access
- ✅ **Use filter views** for custom reports (they don't affect other users)
- ✅ **Name your exported files** clearly: `Stock_Inward_May2026.xlsx`
- ✅ **Keep the original sheet clean** — create reports in separate sheets/files

### Don'ts

- ❌ **Don't merge cells** in the data sheets — this breaks the API
- ❌ **Don't delete or rename columns** — the script depends on exact column names
- ❌ **Don't insert columns** between existing ones — use the Notes column for extra info
- ❌ **Don't edit data directly** in the sheet unless necessary — use the dashboard instead
- ❌ **Don't store JSON or complex data** in cells — keep it flat and simple

### Data Integrity

- The `Purchase_ID` column is the primary key — never modify it
- The `Subtotal` in items should always equal `Quantity × Unit_Price`
- The `Product_Subtotal` in headers should equal the sum of item subtotals
- If you manually edit data, verify these relationships

### Backup Strategy

1. **Weekly:** Download as Excel (.xlsx)
2. **Monthly:** Make a copy (**File → Make a copy**)
3. **Quarterly:** Download and archive all data

### For GST Filing

If your business requires GST filing, your CA will need:
- Supplier-wise purchase summary (Report 2 above)
- Month-wise purchase register (Report 1 above)
- Invoice/voucher numbers for cross-verification

Export these as Excel files and share with your CA during filing season.
