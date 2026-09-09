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

const csvProducts = [];

for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
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
        
        if (name && priceStr) {
            const price = parseFloat(priceStr);
            if (!isNaN(price)) {
                csvProducts.push({ code, name, price });
            }
        }
    }
}

const productsPath = 'products.json';
const srcProductsPath = 'src/data/products.json';
const oldProducts = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

let updatedCount = 0;
let addedCount = 0;

const existingByCode = new Map();
const existingByName = new Map();

for (const p of oldProducts) {
    if (p.code) {
        existingByCode.set(p.code.toLowerCase(), p);
    }
    if (p.name) {
        existingByName.set(p.name.toLowerCase().trim(), p);
    }
}

const finalProducts = [...oldProducts];

for (const cp of csvProducts) {
    let matchedProduct = null;
    
    if (cp.code && existingByCode.has(cp.code.toLowerCase())) {
        matchedProduct = existingByCode.get(cp.code.toLowerCase());
    } else if (cp.name && existingByName.has(cp.name.toLowerCase())) {
        matchedProduct = existingByName.get(cp.name.toLowerCase());
    }
    
    if (matchedProduct) {
        if (matchedProduct.price !== cp.price || matchedProduct.name !== cp.name) {
            matchedProduct.price = cp.price;
            matchedProduct.name = cp.name; // Keep name synced
            updatedCount++;
        }
    } else {
        // Add new product
        finalProducts.push({
            code: cp.code || "",
            name: cp.name,
            price: cp.price,
            image: "https://via.placeholder.com/150"
        });
        addedCount++;
    }
}

fs.writeFileSync(productsPath, JSON.stringify(finalProducts, null, 2));
fs.writeFileSync(srcProductsPath, JSON.stringify(finalProducts, null, 2));

console.log(`Updated ${updatedCount} products. Added ${addedCount} new products.`);
console.log(`Total products now: ${finalProducts.length}`);
