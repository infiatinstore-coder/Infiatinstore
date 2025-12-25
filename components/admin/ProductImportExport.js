'use client';

import { useState, useRef } from 'react';

/**
 * Product Import/Export Admin UI Component
 */
export default function ProductImportExport() {
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    // Download import template
    const handleDownloadTemplate = async () => {
        try {
            const res = await fetch('/api/admin/products/import-template');
            if (!res.ok) throw new Error('Failed to download template');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'product-import-template.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Gagal download template: ' + error.message);
        }
    };

    // Handle file import
    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/products/import', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Import failed');
            }

            setImportResult(data.results);
            alert(`Import selesai: ${data.results.success} berhasil, ${data.results.failed} gagal`);

        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Handle export
    const handleExport = async (format = 'xlsx') => {
        setExporting(true);
        try {
            const res = await fetch(`/api/admin/products/export?format=${format}`);
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `products-export.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Gagal export: ' + error.message);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Import / Export Produk</h2>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Import Section */}
                <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Import Produk
                    </h3>

                    <p className="text-sm text-gray-600 mb-4">
                        Upload file Excel (.xlsx) atau CSV untuk import produk secara massal.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleDownloadTemplate}
                            className="w-full px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm"
                        >
                            📥 Download Template
                        </button>

                        <div className="relative">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleImport}
                                disabled={importing}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <button
                                disabled={importing}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
                            >
                                {importing ? '⏳ Mengimport...' : '📤 Upload File'}
                            </button>
                        </div>
                    </div>

                    {/* Import Results */}
                    {importResult && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium mb-2">Hasil Import:</h4>
                            <div className="text-sm space-y-1">
                                <p className="text-green-600">✓ Berhasil: {importResult.success}</p>
                                <p className="text-red-600">✗ Gagal: {importResult.failed}</p>
                                {importResult.errors?.length > 0 && (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                            Lihat error ({importResult.errors.length})
                                        </summary>
                                        <ul className="mt-2 text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                                            {importResult.errors.map((err, i) => (
                                                <li key={i}>
                                                    Baris {err.row}: {err.error}
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Export Section */}
                <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Produk
                    </h3>

                    <p className="text-sm text-gray-600 mb-4">
                        Download semua data produk dalam format Excel atau CSV.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => handleExport('xlsx')}
                            disabled={exporting}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
                        >
                            {exporting ? '⏳ Mengexport...' : '📊 Export ke Excel'}
                        </button>

                        <button
                            onClick={() => handleExport('csv')}
                            disabled={exporting}
                            className="w-full px-4 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition text-sm disabled:opacity-50"
                        >
                            📄 Export ke CSV
                        </button>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                        <strong>Tips:</strong> Export akan menyertakan semua field produk termasuk ID,
                        sehingga Anda bisa mengedit dan import ulang untuk update massal.
                    </div>
                </div>
            </div>
        </div>
    );
}
