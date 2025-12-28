/**
 * Apply Optimized Images Script
 * Run: node scripts/apply-optimized.js
 * 
 * Replaces original images with optimized versions
 */

const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const OPTIMIZED_DIR = path.join(__dirname, '..', 'public', 'images-optimized');

function copyRecursive(src, dest) {
    const items = fs.readdirSync(src);

    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Replaced: ${item}`);
        }
    }
}

function main() {
    console.log('\n📋 APPLYING OPTIMIZED IMAGES');
    console.log('============================\n');

    if (!fs.existsSync(OPTIMIZED_DIR)) {
        console.log('❌ No optimized images found.');
        console.log('   Run: node scripts/auto-compress.js first');
        return;
    }

    console.log('Replacing original images with optimized versions...\n');

    copyRecursive(OPTIMIZED_DIR, IMAGES_DIR);

    console.log('\n✅ Done! All images have been replaced.');
    console.log('💡 You can delete the images-optimized folder now.');
}

main();
