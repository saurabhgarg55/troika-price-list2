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

const csvCodes = new Set(csvProducts.map(p => p.code.toLowerCase()).filter(Boolean));
const csvNames = new Set(csvProducts.map(p => p.name.toLowerCase().trim()).filter(Boolean));

const productsPath = 'products.json';
const currentProducts = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

const unmatched = currentProducts.filter(p => {
    const matchByCode = p.code && csvCodes.has(p.code.toLowerCase());
    const matchByName = p.name && csvNames.has(p.name.toLowerCase().trim());
    return !(matchByCode || matchByName);
});

console.log(JSON.stringify(unmatched.map(p => ({code: p.code, name: p.name})), null, 2));
