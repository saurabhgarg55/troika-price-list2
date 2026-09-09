const fs = require('fs');

const csvData = fs.readFileSync('new_prices.csv', 'utf8');
const lines = csvData.split(/\r?\n/);

let headerLineIndex = -1;
let codeIndex = -1;
let nameIndex = -1;
let priceIndex = -1;

for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().toLowerCase());
    const cIdx = cols.findIndex(h => h.includes('cat no') || h.includes('cat no.') || h.includes('code') || h === 'no.');
    const nIdx = cols.findIndex(h => h.includes('item name') || h.includes('name'));
    const pIdx = cols.findIndex(h => h.includes('mrp') || h.includes('price'));
    
    if (cIdx !== -1 && nIdx !== -1 && pIdx !== -1) {
        headerLineIndex = i;
        codeIndex = cIdx;
        nameIndex = nIdx;
        priceIndex = pIdx;
        break;
    }
}

console.log(`Header found at line ${headerLineIndex}`);
console.log(`codeIndex: ${codeIndex}, nameIndex: ${nameIndex}, priceIndex: ${priceIndex}`);

const newProducts = [];
for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Handle CSV quoting
    let cols = [];
    let inQuote = false;
    let curr = '';
    for (let char of line) {
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            cols.push(curr);
            curr = '';
        } else {
            curr += char;
        }
    }
    cols.push(curr);
    
    if (cols.length > Math.max(codeIndex, priceIndex, nameIndex)) {
        let code = cols[codeIndex].replace(/(^"|"$)/g, '').trim();
        let name = cols[nameIndex].replace(/(^"|"$)/g, '').trim();
        let priceStr = cols[priceIndex].replace(/(^"|"$)/g, '').replace(/[^0-9.]/g, '').trim();
        
        // Sometimes there are empty rows or category headers (e.g. COCKS) where price is empty
        if (code && name && priceStr) {
            const price = parseFloat(priceStr);
            if (!isNaN(price)) {
                newProducts.push({ code, name, price });
            }
        }
    }
}

console.log(`Found ${newProducts.length} valid product lines in CSV.`);

// Let's compare with products.json
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const existingCodes = new Set(products.map(p => p.code));

let updatedCount = 0;
let newCount = 0;

for (const np of newProducts) {
    if (existingCodes.has(np.code)) {
        updatedCount++;
    } else {
        newCount++;
        // console.log(`New Product: ${np.code} - ${np.name} - ${np.price}`);
    }
}

console.log(`Existing products: ${products.length}`);
console.log(`Matches to update: ${updatedCount}`);
console.log(`New products to add: ${newCount}`);
