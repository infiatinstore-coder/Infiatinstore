'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin';
import { Button, Input } from '@/components/ui';
import { showToast } from '@/components/ui/Toast';
import { Save, Settings } from 'lucide-react';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings');
            const data = await response.json();
            if (response.ok) {
                setSettings(data.settings);
            } else {
                showToast(data.error || 'Failed to fetch settings', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to fetch settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (id, value) => {
        setSettings(
            settings.map((setting) =>
                setting.id === id ? { ...setting, value } : setting
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Settings updated successfully!', 'success');
                fetchSettings(); // Refresh
            } else {
                showToast(data.error || 'Failed to update settings', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to update settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
        const prefix = setting.key.split('_')[0];
        if (!acc[prefix]) acc[prefix] = [];
        acc[prefix].push(setting);
        return acc;
    }, {});

    const categoryTitles = {
        contact: 'Informasi Kontak',
        store: 'Informasi Toko',
        social: 'Media Sosial',
        operating: 'Jam Operasional',
        free: 'Pengaturan Pengiriman',
        return: 'Kebijakan Pengembalian',
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-8 h-8 text-primary-500" />
                    <h1 className="text-2xl font-bold text-neutral-800">
                        Pengaturan Website
                    </h1>
                </div>
                <p className="text-neutral-500">
                    Kelola informasi kontak, alamat, media sosial, dan pengaturan lainnya
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {Object.entries(groupedSettings).map(([category, categorySettings]) => (
                    <div key={category} className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-neutral-800 mb-4 pb-2 border-b">
                            {categoryTitles[category] || category.toUpperCase()}
                        </h2>
                        <div className="grid gap-4">
                            {categorySettings.map((setting) => (
                                <div key={setting.id}>
                                    <Input
                                        label={setting.description || setting.key}
                                        value={setting.value}
                                        onChange={(e) => handleChange(setting.id, e.target.value)}
                                        placeholder={`Masukkan ${setting.description?.toLowerCase() || setting.key}`}
                                    />
                                    <p className="text-xs text-neutral-400 mt-1">
                                        Key: <code className="bg-neutral-100 px-1 py-0.5 rounded">{setting.key}</code>
                                        {setting.is_public && (
                                            <span className="ml-2 text-green-600">• Public</span>
                                        )}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="flex justify-end gap-4 sticky bottom-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-neutral-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={fetchSettings}
                        disabled={saving}
                    >
                        Reset
                    </Button>
                    <Button type="submit" loading={saving}>
                        <Save className="w-4 h-4" />
                        Simpan Perubahan
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
