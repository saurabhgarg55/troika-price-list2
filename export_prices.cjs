const fs = require('fs');
const path = require('path');

const rootProductsPath = path.join(__dirname, 'products.json');

if (!fs.existsSync(rootProductsPath)) {
  console.error("products.json not found!");
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(rootProductsPath, 'utf8'));

let csvContent = "CAT No.,ITEM NAME,MRP\n";
for (const p of products) {
  // Quote the name to handle commas
  const name = `"${p.name.replace(/"/g, '""')}"`;
  csvContent += `${p.code},${name},${p.price}\n`;
}

const outputPath = path.join(__dirname, 'current_prices.csv');
fs.writeFileSync(outputPath, csvContent);
console.log(`Exported ${products.length} products to current_prices.csv`);
