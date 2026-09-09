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

const newProductsMap = new Map();
let parseFails = 0;

for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Better CSV parser
    const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    let cols = [];
    let match;
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
        
        if (code && name && priceStr) {
            const price = parseFloat(priceStr);
            if (!isNaN(price)) {
                newProductsMap.set(code, { code, name, price });
            }
        } else if (code || priceStr) {
            parseFails++;
            // console.log('Partial parse:', cols);
        }
    }
}

console.log(`Parsed ${newProductsMap.size} products from CSV. Partial matches skipped: ${parseFails}`);

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const existingMap = new Map(products.map(p => [p.code, p]));

let missingFromCsv = [];
for (const p of products) {
    if (!newProductsMap.has(p.code)) {
        missingFromCsv.push(p.code);
    }
}

let newFromCsv = [];
for (const code of newProductsMap.keys()) {
    if (!existingMap.has(code)) {
        newFromCsv.push(code);
    }
}

console.log(`Missing from CSV (${missingFromCsv.length}):`, missingFromCsv.slice(0, 10).join(', '));
console.log(`New in CSV (${newFromCsv.length}):`, newFromCsv.slice(0, 10).join(', '));
