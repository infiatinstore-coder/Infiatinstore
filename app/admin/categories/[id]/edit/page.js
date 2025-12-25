'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button, Input } from '@/components/ui';

export default function EditCategoryPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
    });

    useEffect(() => {
        fetchCategory();
    }, []);

    const fetchCategory = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/categories/${params.id}`, {
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Kategori tidak ditemukan');

            const data = await res.json();
            const category = data.data;

            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description || '',
                imageUrl: category.imageUrl || '',
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/admin/categories/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Gagal memperbarui kategori');
            }

            alert('✅ ' + data.message);
            router.push('/admin/categories');
        } catch (error) {
            alert('❌ ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-700 font-medium mb-4">{error}</p>
                    <Link href="/admin/categories">
                        <Button>Kembali ke Kategori</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl">
            {/* Header */}
            <div className="mb-6">
                <Link href="/admin/categories" className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary-500 mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Kategori
                </Link>
                <h1 className="text-2xl font-display font-bold text-neutral-800">Edit Kategori</h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-4">Informasi Kategori</h2>
                    <div className="grid gap-4">
                        <Input
                            label="Nama Kategori"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Contoh: Kurma & Buah Kering"
                            required
                        />
                        <Input
                            label="Slug URL"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            placeholder="kurma-buah-kering"
                            helperText="URL: /category/kurma-buah-kering"
                        />
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                                Deskripsi (Opsional)
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Deskripsi singkat kategori..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        <Input
                            label="URL Gambar (Opsional)"
                            name="imageUrl"
                            type="url"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                            helperText="Gunakan URL gambar dari Unsplash, Imgur, dll"
                        />
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 justify-end">
                    <Link href="/admin/categories">
                        <Button type="button" variant="secondary">Batal</Button>
                    </Link>
                    <Button type="submit" loading={saving}>
                        Simpan Perubahan
                    </Button>
                </div>
            </form>
        </div>
    );
}
