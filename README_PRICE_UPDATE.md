# Updating Prices

You can update the price list using your `.xlsx` (Excel) file or `.csv` file.

### Option 1: Provide / Upload the Excel File (`new_prices.xlsx`)
1. Name your Excel file `new_prices.xlsx` (or `new_prices.csv`).
2. Place it in the root folder of this project.
3. Run or ask the assistant to run:
   - To replace the entire catalog: `node import_prices_xlsx.cjs`
   - To merge/update existing prices: `MODE=merge node import_prices_xlsx.cjs`

### Option 2: Copy & Paste Data
If you prefer not to upload files, open your Excel sheet and copy/paste:
- CAT No. / Code
- Item Name
- Price / MRP
Directly in the chat, and the AI will update the catalog for you.

### Option 3: Export Current Prices
1. Run `node export_prices.cjs`
2. Download `current_prices.csv` to see the current catalog format.
