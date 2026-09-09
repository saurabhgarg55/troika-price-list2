const fs = require('fs');

const oldProductsFile = './products.json';
const oldDataFile = './src/data/products.json';

const oldProducts = JSON.parse(fs.readFileSync(oldProductsFile, 'utf8'));
const oldData = JSON.parse(fs.readFileSync(oldDataFile, 'utf8'));

// We need to parse the OCR text to update the prices
// Since I haven't dumped the OCR text yet, I will write a script that does it based on the text file.

