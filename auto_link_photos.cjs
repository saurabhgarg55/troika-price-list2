const fs = require('fs');
const path = require('path');

const publicProductsDir = path.join(__dirname, 'public', 'products');
const aistudioDir = path.join(__dirname, 'public', 'assets', 'aistudio');

if (!fs.existsSync(publicProductsDir)) {
  fs.mkdirSync(publicProductsDir, { recursive: true });
}

// Gather all photo files in public/products and public/assets/aistudio
function getPhotoFiles(dir, webPrefix) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  const result = [];
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      result.push({
        filename: f,
        stem: path.basename(f, ext),
        webPath: `${webPrefix}/${f}`
      });
    }
  }
  return result;
}

const productPhotos = [
  ...getPhotoFiles(publicProductsDir, '/products'),
  ...getPhotoFiles(aistudioDir, '/assets/aistudio')
];

console.log(`Found ${productPhotos.length} photo files across public/products and public/assets/aistudio`);

function sanitize(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Build map of sanitized photo stems
const photoMap = new Map();
for (const photo of productPhotos) {
  const sanitizedStem = sanitize(photo.stem);
  if (!photoMap.has(sanitizedStem)) {
    photoMap.set(sanitizedStem, photo.webPath);
  }
}

function updateCatalog(filePath) {
  if (!fs.existsSync(filePath)) return;
  const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let matched = 0;

  for (const p of products) {
    if (!p.code && !p.name) continue;

    const codeKey = sanitize(p.code);
    const nameKey = sanitize(p.name);

    if (codeKey && photoMap.has(codeKey)) {
      p.image = photoMap.get(codeKey);
      matched++;
    } else if (nameKey && photoMap.has(nameKey)) {
      p.image = photoMap.get(nameKey);
      matched++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
  console.log(`Linked photos for ${matched} items in ${filePath}`);
}

updateCatalog(path.join(__dirname, 'products.json'));
updateCatalog(path.join(__dirname, 'src', 'data', 'products.json'));
console.log('Photo linking complete!');
