const fs = require('fs');
const path = require('path');

// 1. Read the CSV file
// Assuming the user saves their Excel file as a CSV named 'new_prices.csv'
const csvFilePath = path.join(__dirname, 'new_prices.csv');

if (!fs.existsSync(csvFilePath)) {
  console.error("Please place 'new_prices.csv' in the root folder of the project.");
  console.error("The CSV should have headers, and columns for 'Code' and 'Price' (e.g., RE 5101, 6435).");
  process.exit(1);
}

const csvData = fs.readFileSync(csvFilePath, 'utf8');

// Parse CSV
const lines = csvData.split('\n').filter(line => line.trim().length > 0);
const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

const codeIndex = headers.findIndex(h => h.includes('cat no.') || h.includes('code') || h.includes('item no'));
const priceIndex = headers.findIndex(h => h.includes('mrp') || h.includes('price'));

if (codeIndex === -1 || priceIndex === -1) {
  console.error("Could not find 'Code' or 'Price'/'MRP' columns in the CSV headers.");
  console.error("Found headers:", headers);
  process.exit(1);
}

const newPricesMap = {};

for (let i = 1; i < lines.length; i++) {
  // Handle commas inside quotes in CSV
  const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
  let matches = [];
  let match;
  while ((match = regex.exec(lines[i])) !== null) {
      matches.push(match[1].replace(/(^"|"$)/g, '').trim());
  }
  
  if (matches.length > Math.max(codeIndex, priceIndex)) {
    const code = matches[codeIndex];
    const priceStr = matches[priceIndex].replace(/[^0-9.]/g, ''); // Remove currency symbols/commas
    const price = parseFloat(priceStr);
    
    if (code && !isNaN(price)) {
      newPricesMap[code] = price;
    }
  }
}

console.log(`Loaded ${Object.keys(newPricesMap).length} new prices from CSV.`);

// 2. Update products.json
const rootProductsPath = path.join(__dirname, 'products.json');
const srcProductsPath = path.join(__dirname, 'src', 'data', 'products.json');

function updateJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  
  const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updateCount = 0;
  
  for (const product of products) {
    if (newPricesMap[product.code]) {
      if (product.price !== newPricesMap[product.code]) {
        product.price = newPricesMap[product.code];
        updateCount++;
      }
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
  console.log(`Updated ${updateCount} prices in ${filePath}`);
}

updateJsonFile(rootProductsPath);
updateJsonFile(srcProductsPath);

console.log("Price update complete!");
