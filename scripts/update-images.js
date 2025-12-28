const fs = require('fs');

let content = fs.readFileSync('data/products.js', 'utf8');

// Replace images for each product category
const replacements = [
    { pattern: /id: 'p_ajwa.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kurma-ajwa.png']") },
    { pattern: /id: 'p_sukkari.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kurma-sukkari.png']") },
    { pattern: /id: 'p_khalas.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kurma-khalas.png']") },
    { pattern: /id: 'p_date_crown.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kurma-khalas.png']") },
    { pattern: /id: 'p_barari.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kurma-khalas.png']") },
    { pattern: /id: 'p_golden_valley.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kurma-sukkari.png']") },
    { pattern: /id: 'p_gizza.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kurma-sukkari.png']") },
    { pattern: /id: 'p_zamzam.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/air-zamzam.png']") },
    { pattern: /id: 'p_pistachio.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kacang-pistachio.png']") },
    { pattern: /id: 'p_almond.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kacang-pistachio.png']") },
    { pattern: /id: 'p_kacang_arab.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kacang-pistachio.png']") },
    { pattern: /id: 'p_cokelat.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kacang-pistachio.png']") },
    { pattern: /id: 'p_sajadah.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/sajadah-turki.png']") },
    { pattern: /id: 'p_tasbih.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/sajadah-turki.png']") },
    { pattern: /id: 'p_minyak.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/air-zamzam.png']") },
    { pattern: /id: 'p_serbuk.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/sajadah-turki.png']") },
    { pattern: /id: 'p_madu.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/air-zamzam.png']") },
    { pattern: /id: 'p_parfum.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/air-zamzam.png']") },
    { pattern: /id: 'p_paket.*?images: \['.+?'\]/gs, replacement: (match) => match.replace(/images: \['.+?'\]/, "images: ['/images/products/kurma-ajwa.png']") },
];

replacements.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
});

fs.writeFileSync('data/products.js', content);
console.log('✅ Images updated successfully!');
