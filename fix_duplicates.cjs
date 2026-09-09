const fs = require('fs');

const productsPath = 'products.json';
const srcProductsPath = 'src/data/products.json';

let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Remove the old duplicates
products = products.filter(p => p.name !== 'PTMT Connection Pipe 36"' && p.name !== 'SOAP DISEPSOR New');

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
fs.writeFileSync(srcProductsPath, JSON.stringify(products, null, 2));

console.log("Removed old duplicates. Total products:", products.length);
