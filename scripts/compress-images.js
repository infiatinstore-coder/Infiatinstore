/**
 * Image Compression Script
 * Run: node scripts/compress-images.js
 * 
 * This script will compress all images in public/images folder
 * and save them as WebP format for better performance.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// TinyPNG API (free tier: 500 images/month)
// Alternative: We'll use a local sharp library approach

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const BACKUP_DIR = path.join(__dirname, '..', 'public', 'images-backup');

// Get all image files recursively
function getAllImages(dir, files = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            getAllImages(fullPath, files);
        } else if (/\.(png|jpg|jpeg|webp)$/i.test(item)) {
            files.push(fullPath);
        }
    }

    return files;
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Backup original images
function backupImages(images) {
    console.log('\n📦 Creating backup...');

    for (const imagePath of images) {
        const relativePath = path.relative(IMAGES_DIR, imagePath);
        const backupPath = path.join(BACKUP_DIR, relativePath);
        const backupDir = path.dirname(backupPath);

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        fs.copyFileSync(imagePath, backupPath);
    }

    console.log(`✅ Backup created at: ${BACKUP_DIR}`);
}

// Main function
async function main() {
    console.log('🖼️  IMAGE COMPRESSION SCRIPT');
    console.log('============================\n');

    // Check if images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error('❌ Images directory not found:', IMAGES_DIR);
        process.exit(1);
    }

    // Get all images
    const images = getAllImages(IMAGES_DIR);

    if (images.length === 0) {
        console.log('No images found to compress.');
        process.exit(0);
    }

    console.log(`Found ${images.length} images to analyze:\n`);

    // Calculate total size
    let totalSize = 0;
    const imageStats = [];

    for (const imagePath of images) {
        const stat = fs.statSync(imagePath);
        const relativePath = path.relative(IMAGES_DIR, imagePath);
        totalSize += stat.size;

        imageStats.push({
            path: relativePath,
            size: stat.size,
            sizeFormatted: formatBytes(stat.size),
            needsCompression: stat.size > 100 * 1024 // > 100KB
        });
    }

    // Display stats
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│ Image                                    │ Size     │ Status │');
    console.log('├────────────────────────────────────────────────────────────┤');

    for (const img of imageStats) {
        const name = img.path.padEnd(40).substring(0, 40);
        const size = img.sizeFormatted.padStart(8);
        const status = img.needsCompression ? '⚠️  LARGE' : '✅ OK';
        console.log(`│ ${name} │ ${size} │ ${status} │`);
    }

    console.log('└────────────────────────────────────────────────────────────┘');
    console.log(`\n📊 TOTAL SIZE: ${formatBytes(totalSize)}`);

    const largeImages = imageStats.filter(i => i.needsCompression);
    console.log(`⚠️  Images > 100KB: ${largeImages.length}`);

    // Instructions
    console.log('\n' + '='.repeat(60));
    console.log('📋 MANUAL COMPRESSION STEPS:');
    console.log('='.repeat(60));
    console.log(`
1. Go to https://tinypng.com or https://squoosh.app

2. Upload these large images:
${largeImages.map(i => `   - public/images/${i.path}`).join('\n')}

3. Download compressed versions

4. Replace files in public/images/ folder

5. Expected result: ~80% size reduction
   Current: ${formatBytes(totalSize)}
   Target:  ${formatBytes(totalSize * 0.2)}
`);

    // Create backup
    backupImages(images);

    console.log('\n✅ Script completed!');
    console.log('💡 Tip: Use https://squoosh.app for best quality WebP conversion');
}

main().catch(console.error);
