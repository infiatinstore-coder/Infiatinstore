#!/usr/bin/env node
/**
 * Script to replace jsonwebtoken imports with jose-based helpers
 * Run with: node scripts/fix-jwt-imports.js
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
    'app/api/cart/route.js',
    'app/api/orders/route.js',
    'app/api/orders/[id]/route.js',
    'app/api/addresses/route.js',
    'app/api/reviews/route.js',
    'app/api/reviews/[id]/route.js',
    'app/api/reviews/[id]/helpful/route.js',
    'app/api/auth/me/route.js',
];

const replacements = [
    {
        // Remove jsonwebtoken import
        from: /import jwt from ['"]jsonwebtoken['"];?\s*/g,
        to: ''
    },
    {
        // Remove JWT_SECRET constant
        from: /const JWT_SECRET = process\.env\.JWT_SECRET \|\| ['"].*?['"];?\s*/g,
        to: ''
    },
    {
        // Add requireAuth import if not exists
        from: /(import.*from.*@\/lib\/prisma';?\s*)/,
        to: "$1import { requireAuth } from '@/lib/auth';\n"
    }
];

console.log('🔧 Fixing JWT imports...\n');

filesToFix.forEach(file => {
    const filePath = path.join(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Apply replacements
    replacements.forEach(({ from, to }) => {
        content = content.replace(from, to);
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${file}`);
    } else {
        console.log(`⏭️  Skipped: ${file} (no changes needed)`);
    }
});

console.log('\n✅ JWT import fix completed!');
console.log('⚠️  Note: You still need to refactor auth logic to use requireAuth wrapper');
