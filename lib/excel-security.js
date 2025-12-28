/**
 * Excel Security Utilities
 * Mitigasi untuk SheetJS vulnerability
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const PARSING_TIMEOUT = 30000; // 30 seconds

/**
 * Validate Excel file before processing
 */
export function validateExcelFile(file) {
    const errors = [];

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        errors.push(`File terlalu besar. Maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file extension
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`Format file tidak didukung. Gunakan: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Check MIME type
    const validMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ];
    if (file.type && !validMimeTypes.includes(file.type)) {
        errors.push('MIME type file tidak valid');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize field names from Excel to prevent prototype pollution
 */
export function sanitizeFieldName(fieldName) {
    if (!fieldName || typeof fieldName !== 'string') {
        return '';
    }

    // Remove dangerous property names
    const dangerous = ['__proto__', 'constructor', 'prototype'];
    if (dangerous.includes(fieldName.toLowerCase())) {
        return '';
    }

    // Only allow alphanumeric, underscore, and common chars
    return fieldName
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim()
        .substring(0, 100); // Max 100 chars
}

/**
 * Sanitize Excel data object
 */
export function sanitizeExcelData(data) {
    if (!data || typeof data !== 'object') {
        return {};
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
        const cleanKey = sanitizeFieldName(key);
        if (cleanKey) {
            // Recursively sanitize nested objects
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                sanitized[cleanKey] = sanitizeExcelData(value);
            } else {
                sanitized[cleanKey] = value;
            }
        }
    }

    return sanitized;
}

/**
 * Parse Excel with timeout protection
 */
export async function parseExcelWithTimeout(parseFunction, timeout = PARSING_TIMEOUT) {
    return Promise.race([
        parseFunction(),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Excel parsing timeout')), timeout)
        )
    ]);
}

/**
 * Validate Excel row count
 */
export function validateRowCount(rows, maxRows = 1000) {
    if (!Array.isArray(rows)) {
        return { valid: false, error: 'Data bukan array' };
    }

    if (rows.length === 0) {
        return { valid: false, error: 'File Excel kosong' };
    }

    if (rows.length > maxRows) {
        return {
            valid: false,
            error: `Terlalu banyak baris. Maksimal ${maxRows} baris per upload`
        };
    }

    return { valid: true };
}
