'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Plus, Edit, Trash2, Check, Home, Briefcase } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart';
import { Button, Input, Badge } from '@/components/ui';

// Mock addresses
const mockAddresses = [
    {
        id: '1',
        label: 'HOME',
        recipientName: 'Budi Santoso',
        phone: '081234567890',
        fullAddress: 'Jl. Sudirman No. 123, RT 01/RW 02, Kelurahan Menteng',
        city: 'Jakarta Pusat',
        postalCode: '10310',
        isDefault: true,
    },
    {
        id: '2',
        label: 'OFFICE',
        recipientName: 'Budi Santoso',
        phone: '081234567890',
        fullAddress: 'Gedung Graha Niaga Lt. 15, Jl. Jend. Sudirman Kav. 58',
        city: 'Jakarta Selatan',
        postalCode: '12190',
        isDefault: false,
    },
];

const labelIcons = {
    HOME: Home,
    OFFICE: Briefcase,
};

export default function AddressesPage() {
    const [addresses, setAddresses] = useState(mockAddresses);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        label: 'HOME',
        recipientName: '',
        phone: '',
        fullAddress: '',
        city: '',
        postalCode: '',
        isDefault: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSave = () => {
        if (editingId) {
            setAddresses(addresses.map((addr) =>
                addr.id === editingId ? { ...formData, id: editingId } : addr
            ));
        } else {
            setAddresses([...addresses, { ...formData, id: Date.now().toString() }]);
        }
        resetForm();
    };

    const handleEdit = (address) => {
        setFormData(address);
        setEditingId(address.id);
        setIsAdding(true);
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus alamat ini?')) {
            setAddresses(addresses.filter((addr) => addr.id !== id));
        }
    };

    const handleSetDefault = (id) => {
        setAddresses(addresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === id,
        })));
    };

    const resetForm = () => {
        setFormData({
            label: 'HOME',
            recipientName: '',
            phone: '',
            fullAddress: '',
            city: '',
            postalCode: '',
            isDefault: false,
        });
        setIsAdding(false);
        setEditingId(null);
    };

    return (
        <>
            <Header />
            <CartDrawer />
            <main className="flex-1 bg-neutral-50">
                <div className="container-app py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <Link href="/account" className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary-500 mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Akun
                        </Link>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-800">Alamat Saya</h1>
                                <p className="text-neutral-500">Kelola alamat pengiriman Anda</p>
                            </div>
                            {!isAdding && (
                                <Button onClick={() => setIsAdding(true)}>
                                    <Plus className="w-4 h-4" />
                                    Tambah Alamat
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Add/Edit Form */}
                    {isAdding && (
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <h2 className="text-lg font-semibold text-neutral-800 mb-4">
                                {editingId ? 'Edit Alamat' : 'Tambah Alamat Baru'}
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Label</label>
                                    <div className="flex gap-3">
                                        {['HOME', 'OFFICE'].map((label) => {
                                            const Icon = labelIcons[label];
                                            return (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, label })}
                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-colors ${formData.label === label
                                                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                                                            : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                                                        }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {label === 'HOME' ? 'Rumah' : 'Kantor'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <Input
                                    label="Nama Penerima"
                                    name="recipientName"
                                    value={formData.recipientName}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label="Nomor Telepon"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="Alamat Lengkap"
                                        name="fullAddress"
                                        value={formData.fullAddress}
                                        onChange={handleChange}
                                        placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                                        required
                                    />
                                </div>
                                <Input
                                    label="Kota"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label="Kode Pos"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                    required
                                />
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="isDefault"
                                            checked={formData.isDefault}
                                            onChange={handleChange}
                                            className="w-5 h-5 rounded border-neutral-300 text-primary-500"
                                        />
                                        <span className="text-neutral-700">Jadikan alamat utama</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button variant="secondary" onClick={resetForm}>Batal</Button>
                                <Button onClick={handleSave}>Simpan Alamat</Button>
                            </div>
                        </div>
                    )}

                    {/* Address List */}
                    <div className="space-y-4">
                        {addresses.map((address) => {
                            const LabelIcon = labelIcons[address.label] || Home;
                            return (
                                <div key={address.id} className="bg-white rounded-xl shadow-sm p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <LabelIcon className="w-5 h-5 text-primary-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-neutral-800">
                                                        {address.label === 'HOME' ? 'Rumah' : 'Kantor'}
                                                    </span>
                                                    {address.isDefault && (
                                                        <Badge variant="primary" size="sm">Utama</Badge>
                                                    )}
                                                </div>
                                                <p className="font-medium text-neutral-700">{address.recipientName}</p>
                                                <p className="text-sm text-neutral-500">{address.phone}</p>
                                                <p className="text-sm text-neutral-500 mt-1">
                                                    {address.fullAddress}, {address.city} {address.postalCode}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:flex-shrink-0">
                                            {!address.isDefault && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleSetDefault(address.id)}
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Jadikan Utama
                                                </Button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(address)}
                                                className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(address.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {addresses.length === 0 && !isAdding && (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <MapPin className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-neutral-800 mb-2">Belum ada alamat</h3>
                                <p className="text-neutral-500 mb-6">Tambahkan alamat pengiriman Anda</p>
                                <Button onClick={() => setIsAdding(true)}>
                                    <Plus className="w-4 h-4" />
                                    Tambah Alamat
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
