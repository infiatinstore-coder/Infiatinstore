'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function ImageUploader({
    images = [],
    onImagesChange,
    maxImages = 5,
    label = "Upload Gambar"
}) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (files) => {
        if (!files || files.length === 0) return;

        // Check max images limit
        if (images.length + files.length > maxImages) {
            alert(`❌ Maksimal ${maxImages} gambar`);
            return;
        }

        setUploading(true);

        try {
            const uploadedUrls = [];

            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/upload/image', {
                    method: 'POST',
                    body: formData,
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Upload gagal');
                }

                uploadedUrls.push(data.data.url);
            }

            // Add new URLs to existing images
            onImagesChange([...images, ...uploadedUrls]);

        } catch (error) {
            alert('❌ ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        handleFileSelect(files);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleRemove = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
                {label}
            </label>

            {/* Image Preview Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                    {images.map((url, index) => (
                        <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 group"
                        >
                            <img
                                src={url}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {index === 0 && (
                                <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary-500 text-white text-xs font-medium rounded">
                                    Utama
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Area */}
            {images.length < maxImages && (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                        ${dragActive
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
                        }
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                            <p className="text-sm text-neutral-600">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                <Upload className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-700">
                                    Klik atau drag gambar ke sini
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                    JPG, PNG, WebP, GIF (max 5MB)
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <p className="text-xs text-neutral-500 mt-2">
                {images.length}/{maxImages} gambar • Gambar pertama akan menjadi gambar utama
            </p>
        </div>
    );
}
