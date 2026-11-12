const fs = require('fs');
const path = require('path');

const rootProductsPath = path.join(__dirname, 'products.json');
const srcProductsPath = path.join(__dirname, 'src', 'data', 'products.json');
const csvPath = path.join(__dirname, 'current_prices.csv');

function formatImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let str = url.trim();

  // Convert Google Drive view links to direct image embed links
  if (str.includes('drive.google.com') || str.includes('docs.google.com')) {
    const fileIdMatch = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
  }
  return str;
}

const rootProducts = fs.existsSync(rootProductsPath) ? JSON.parse(fs.readFileSync(rootProductsPath, 'utf8')) : [];
const srcProducts = fs.existsSync(srcProductsPath) ? JSON.parse(fs.readFileSync(srcProductsPath, 'utf8')) : [];

// Merge by product code + name
const map = new Map();

for (const p of rootProducts) {
  const key = `${p.code || ''}___${p.name || ''}___${p.size || ''}`.toLowerCase();
  map.set(key, { ...p, image: formatImageUrl(p.image) });
}

for (const p of srcProducts) {
  const key = `${p.code || ''}___${p.name || ''}___${p.size || ''}`.toLowerCase();
  const existing = map.get(key) || {};
  const mergedImage = formatImageUrl(p.image) || existing.image || '';
  map.set(key, {
    code: p.code || existing.code || '',
    name: p.name || existing.name || '',
    price: p.price !== undefined ? p.price : (existing.price !== undefined ? existing.price : 0),
    size: p.size || existing.size || null,
    category: p.category || existing.category || undefined,
    image: mergedImage
  });
}

const cleanProducts = Array.from(map.values());

// Save to both JSON files
fs.writeFileSync(rootProductsPath, JSON.stringify(cleanProducts, null, 2));
fs.writeFileSync(srcProductsPath, JSON.stringify(cleanProducts, null, 2));

console.log(`Synced ${cleanProducts.length} items to products.json and src/data/products.json`);

// Update current_prices.csv
let csvContent = 'CAT No.,ITEM NAME,MRP,SIZE,IMAGE\n';
for (const p of cleanProducts) {
  const name = `"${(p.name || '').replace(/"/g, '""')}"`;
  const size = p.size ? `"${p.size}"` : '';
  const image = p.image ? `"${p.image}"` : '';
  csvContent += `${p.code || ''},${name},${p.price !== undefined ? p.price : ''},${size},${image}\n`;
}
fs.writeFileSync(csvPath, csvContent);
console.log(`Updated ${csvPath}`);
console.log('Product catalog sync complete!');
