# Backend Setup Guide

This guide explains how to set up the Google Sheets database and the Google Apps Script backend for your Inventory Management Dashboard.

## Step 1: Prepare Your Google Sheet

You need to create a new Google Sheet (or use your existing one) with **five specific tabs (sheets)**. 

Open your Google Sheet, and create the following tabs EXACTLY as named below. Then, paste the column names into the first row (Row 1) of each sheet.

### Sheet 1: `Purchase_Headers`
| Purchase_ID | Entry_Type | Billing_Date | Voucher_Number | Supplier_Name | Logistics_Charges | Product_Subtotal | Notes | Created_At | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

### Sheet 2: `Purchase_Items`
| Purchase_ID | Commodity_Name | Quantity | Unit | Unit_Price | Subtotal |
| :--- | :--- | :--- | :--- | :--- | :--- |

### Sheet 3: `Inventory`
| ID | Name | Default_Price | Stock | Min_Price | Max_Price |
| :--- | :--- | :--- | :--- | :--- | :--- |

### Sheet 4: `Ledger`
| ID | Date | Type | Amount | Description | Balance |
| :--- | :--- | :--- | :--- | :--- | :--- |

### Sheet 5: `Settings`
| Key | Value |
| :--- | :--- |

> **Tip:** You can make Row 1 bold and freeze it (View > Freeze > 1 row) to make it easier to read.

---

## Step 2: Configure Google Apps Script

1. In your Google Sheet, click on **Extensions > Apps Script** from the top menu.
2. This will open the Apps Script editor. Delete any code currently in the `Code.gs` file.
3. Open the local file `google-apps-script/Code.gs` from this codebase, copy all of its contents, and paste it into the Google Apps Script editor.
4. **CRITICAL:** Look at line 9 in the script:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```
   Replace `'YOUR_SPREADSHEET_ID_HERE'` with the actual ID of your Google Sheet. You can find this ID in the URL of your Google Sheet:
   `https://docs.google.com/spreadsheets/d/`**`[YOUR_SPREADSHEET_ID]`**`/edit`

5. Click the **Save** icon (or press `Ctrl+S` / `Cmd+S`).

---

## Step 3: Deploy as a Web App

1. In the top right corner of the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the details:
   - **Description:** `Initial Backend Deployment`
   - **Execute as:** `Me (your email)`
   - **Who has access:** `Anyone` (This is required for the React app to communicate with it).
4. Click **Deploy**.
5. *Note: Google will ask you to authorize access. Click "Authorize access", select your Google account, click "Advanced", and then "Go to project (unsafe)". Allow the permissions.*
6. After deployment, Google will provide you with a **Web app URL**. It starts with `https://script.google.com/macros/s/...`.
7. **Copy this URL**.

---

## Step 4: Connect the React App

1. Open `src/services/api.js` in your local project codebase.
2. Find the following line near the top:
   ```javascript
   const API_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
   ```
3. Replace `'YOUR_APPS_SCRIPT_URL_HERE'` with the Web App URL you copied in Step 3.
4. Find the `USE_SAMPLE_DATA` flag and set it to `false`:
   ```javascript
   const USE_SAMPLE_DATA = false;
   ```
5. Save the file. Your dashboard is now connected to your live Google Sheet!
