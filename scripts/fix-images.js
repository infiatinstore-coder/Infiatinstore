const fs = require('fs');
const path = require('path');

// Read products file
const productsPath = path.join(__dirname, '..', 'data', 'products.js');
let content = fs.readFileSync(productsPath, 'utf8');

// Replace all Unsplash URLs with placeholder
content = content.replace(
    /https:\/\/images\.unsplash\.com\/[^\s'"]+/g,
    '/api/placeholder/800x600'
);

// Write back
fs.writeFileSync(productsPath, content, 'utf8');

console.log('✅ All product images updated to use placeholder API');
