const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Look for new_prices.xlsx, prices.xlsx, or new_prices.csv
const possibleFiles = [
  'new_prices.xlsx',
  'prices.xlsx',
  'pricelist.xlsx',
  'price_list.xlsx',
  'new_prices.csv'
];

let targetFile = process.argv[2];
if (!targetFile) {
  for (const f of possibleFiles) {
    if (fs.existsSync(path.join(__dirname, f))) {
      targetFile = f;
      break;
    }
  }
}

if (!targetFile || !fs.existsSync(path.join(__dirname, targetFile))) {
  console.log("No file found! Please place 'new_prices.xlsx' in the project root or specify a file name: node import_prices_xlsx.cjs <filename>");
  process.exit(1);
}

console.log(`Reading: ${targetFile}...`);
const fullPath = path.join(__dirname, targetFile);

const workbook = XLSX.readFile(fullPath);
const sheetName = workbook.SheetNames[0];
console.log(`Using sheet: "${sheetName}"`);
const sheet = workbook.Sheets[sheetName];

// Convert sheet to json with header detection
const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

if (!rawRows || rawRows.length === 0) {
  console.error("Sheet is empty!");
  process.exit(1);
}

// Find header row
let headerRowIndex = -1;
let codeCol = -1;
let nameCol = -1;
let priceCol = -1;
let sizeCol = -1;

for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
  const row = rawRows[r].map(c => String(c).trim().toLowerCase());
  
  const cIdx = row.findIndex(h => h.includes('cat no') || h.includes('code') || h.includes('item no') || h === 'no.' || h === 'art no' || h.includes('item code'));
  const nIdx = row.findIndex(h => h.includes('name') || h.includes('description') || h.includes('item') || h.includes('particular'));
  const pIdx = row.findIndex(h => h.includes('mrp') || h.includes('price') || h.includes('rate'));
  const sIdx = row.findIndex(h => h.includes('size') || h.includes('dimension'));

  if ((cIdx !== -1 || nIdx !== -1) && pIdx !== -1) {
    headerRowIndex = r;
    codeCol = cIdx;
    nameCol = nIdx;
    priceCol = pIdx;
    sizeCol = sIdx;
    console.log(`Found headers at row ${r + 1}: Code col = ${codeCol}, Name col = ${nameCol}, Price col = ${priceCol}, Size col = ${sizeCol}`);
    break;
  }
}

if (headerRowIndex === -1 || priceCol === -1) {
  console.error("Could not find required columns (Code/Name and Price/MRP) in the first 15 rows.");
  console.log("First few rows:", rawRows.slice(0, 5));
  process.exit(1);
}

const parsedProducts = [];

for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
  const row = rawRows[r];
  if (!row || row.length === 0) continue;

  const rawCode = codeCol !== -1 ? String(row[codeCol] || '').trim() : '';
  const rawName = nameCol !== -1 ? String(row[nameCol] || '').trim() : '';
  const rawPrice = priceCol !== -1 ? String(row[priceCol] || '').trim() : '';
  const rawSize = sizeCol !== -1 ? String(row[sizeCol] || '').trim() : '';

  if (!rawCode && !rawName) continue;

  const cleanPriceStr = rawPrice.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPriceStr);

  if (!isNaN(price) && (rawName || rawCode)) {
    const item = {
      code: rawCode,
      name: rawName || rawCode,
      price: price
    };
    if (rawSize) {
      item.size = rawSize;
    }
    parsedProducts.push(item);
  }
}

console.log(`Successfully extracted ${parsedProducts.length} items from ${targetFile}`);

if (parsedProducts.length === 0) {
  console.error("No valid products could be parsed.");
  process.exit(1);
}

// Mode: replace or update
const mode = process.env.MODE || 'replace'; // 'replace' or 'merge'

let finalProducts = [];
if (mode === 'replace') {
  finalProducts = parsedProducts;
  console.log(`Replacing entire catalog with ${finalProducts.length} new items.`);
} else {
  // Merge mode
  const currentPath = path.join(__dirname, 'products.json');
  const existing = fs.existsSync(currentPath) ? JSON.parse(fs.readFileSync(currentPath, 'utf8')) : [];
  
  const mapByCode = new Map();
  for (const item of existing) {
    if (item.code) mapByCode.set(item.code.toLowerCase().trim(), item);
  }

  let updatedCount = 0;
  let addedCount = 0;

  for (const item of parsedProducts) {
    const key = item.code ? item.code.toLowerCase().trim() : null;
    if (key && mapByCode.has(key)) {
      const existingItem = mapByCode.get(key);
      existingItem.price = item.price;
      if (item.name) existingItem.name = item.name;
      if (item.size) existingItem.size = item.size;
      updatedCount++;
    } else {
      existing.push(item);
      addedCount++;
    }
  }

  finalProducts = existing;
  console.log(`Merged: ${updatedCount} updated, ${addedCount} added. Total items: ${finalProducts.length}`);
}

// Save to root products.json and src/data/products.json
const rootPath = path.join(__dirname, 'products.json');
const srcPath = path.join(__dirname, 'src', 'data', 'products.json');

fs.writeFileSync(rootPath, JSON.stringify(finalProducts, null, 2));
fs.writeFileSync(srcPath, JSON.stringify(finalProducts, null, 2));

console.log(`Saved updated product catalog to ${rootPath} and ${srcPath}`);
