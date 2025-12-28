/**
 * Auto Image Compression Script v2
 * Run: node scripts/auto-compress.js
 * 
 * Automatically compresses all images using Sharp library
 * Saves to a new 'optimized' folder to avoid file locking issues
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images-optimized');

// Configuration
const CONFIG = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 75, // 75% quality for smaller files
};

// Get all image files recursively
function getAllImages(dir, files = []) {
    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.includes('backup') && !item.includes('optimized')) {
            getAllImages(fullPath, files);
        } else if (/\.(png|jpg|jpeg)$/i.test(item)) {
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

// Compress single image
async function compressImage(inputPath, outputPath) {
    const originalSize = fs.statSync(inputPath).size;

    try {
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Read file into buffer first to avoid locking
        const inputBuffer = fs.readFileSync(inputPath);

        let sharpInstance = sharp(inputBuffer);

        // Get metadata
        const metadata = await sharpInstance.metadata();

        // Resize if too large
        if (metadata.width > CONFIG.maxWidth || metadata.height > CONFIG.maxHeight) {
            sharpInstance = sharpInstance.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        // Compress to PNG
        await sharpInstance
            .png({
                quality: CONFIG.quality,
                compressionLevel: 9,
                palette: true
            })
            .toFile(outputPath);

        const newSize = fs.statSync(outputPath).size;

        return {
            success: true,
            originalSize,
            newSize,
            saved: originalSize - newSize,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            originalSize,
        };
    }
}

// Main function
async function main() {
    console.log('');
    console.log('🖼️  AUTO IMAGE COMPRESSION v2');
    console.log('==============================\n');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Get all images
    const images = getAllImages(IMAGES_DIR);

    if (images.length === 0) {
        console.log('No images found.');
        return;
    }

    console.log(`Found ${images.length} images to compress...`);
    console.log(`Output: ${OUTPUT_DIR}\n`);

    let totalOriginal = 0;
    let totalNew = 0;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < images.length; i++) {
        const imagePath = images[i];
        const relativePath = path.relative(IMAGES_DIR, imagePath);
        const outputPath = path.join(OUTPUT_DIR, relativePath);

        process.stdout.write(`[${i + 1}/${images.length}] ${relativePath.substring(0, 35).padEnd(35)}... `);

        const result = await compressImage(imagePath, outputPath);

        if (result.success) {
            totalOriginal += result.originalSize;
            totalNew += result.newSize;

            const percent = ((result.saved / result.originalSize) * 100).toFixed(0);
            console.log(`✅ ${formatBytes(result.originalSize)} → ${formatBytes(result.newSize)} (-${percent}%)`);
            successCount++;
        } else {
            console.log(`❌ ${result.error}`);
            errorCount++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPRESSION SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Compressed:    ${successCount}/${images.length} images`);
    console.log(`   Errors:        ${errorCount}`);
    console.log('');
    console.log(`   Original size: ${formatBytes(totalOriginal)}`);
    console.log(`   New size:      ${formatBytes(totalNew)}`);
    console.log(`   Space saved:   ${formatBytes(totalOriginal - totalNew)}`);
    console.log(`   Reduction:     ${(((totalOriginal - totalNew) / totalOriginal) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Check images in: public/images-optimized/');
    console.log('2. If happy, run: npm run images:apply');
    console.log('   (This will replace original images with optimized ones)\n');
}

main().catch(console.error);
