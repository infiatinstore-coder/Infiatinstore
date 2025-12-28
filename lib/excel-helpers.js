/**
 * ExcelJS Helper Utilities
 * Migration from SheetJS to ExcelJS
 */

import ExcelJS from 'exceljs';

/**
 * Read Excel/CSV file from buffer
 * @param {Buffer} buffer - File buffer
 * @param {string} type - 'xlsx' or 'csv'
 * @returns {Promise<Array>} Array of row objects
 */
export async function readExcelBuffer(buffer, type = 'xlsx') {
    const workbook = new ExcelJS.Workbook();

    if (type === 'csv') {
        await workbook.csv.read(buffer);
    } else {
        await workbook.xlsx.load(buffer);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        throw new Error('No worksheet found in file');
    }

    const rows = [];
    const headers = [];

    // Get headers from first row
    worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || `Column${colNumber}`;
    });

    // Get data rows
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData = {};
        row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            rowData[header] = cell.value;
        });

        rows.push(rowData);
    });

    return rows;
}

/**
 * Create Excel workbook from JSON data
 * @param {Array} data - Array of objects
 * @param {string} sheetName - Name of worksheet
 * @returns {Promise<ExcelJS.Workbook>} Workbook instance
 */
export async function createExcelFromJSON(data, sheetName = 'Sheet1') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (!data || data.length === 0) {
        return workbook;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
    };

    // Add data rows
    data.forEach(item => {
        const row = headers.map(header => item[header]);
        worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const length = cell.value ? cell.value.toString().length : 10;
            if (length > maxLength) {
                maxLength = length;
            }
        });
        column.width = Math.min(maxLength + 2, 50);
    });

    return workbook;
}

/**
 * Generate Excel buffer
 * @param {ExcelJS.Workbook} workbook
 * @returns {Promise<Buffer>}
 */
export async function generateExcelBuffer(workbook) {
    return await workbook.xlsx.writeBuffer();
}

/**
 * Generate CSV buffer
 * @param {ExcelJS.Workbook} workbook
 * @returns {Promise<Buffer>}
 */
export async function generateCSVBuffer(workbook) {
    return await workbook.csv.writeBuffer();
}

/**
 * Create template Excel with headers
 * @param {Array<string>} headers - Column headers
 * @param {string} sheetName - Worksheet name
 * @returns {Promise<ExcelJS.Workbook>}
 */
export async function createTemplate(headers, sheetName = 'Template') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add header row
    worksheet.addRow(headers);

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };

    // Add a sample row with placeholder data
    const sampleRow = headers.map(h => `Sample ${h}`);
    worksheet.addRow(sampleRow);

    // Auto-fit columns
    headers.forEach((header, index) => {
        worksheet.getColumn(index + 1).width = Math.max(header.length + 5, 15);
    });

    return workbook;
}
