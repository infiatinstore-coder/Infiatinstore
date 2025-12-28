'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart';
import { Button, Input } from '@/components/ui';
import { showToast } from '@/components/ui/Toast';

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({});
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(err => console.error('Failed to load settings:', err));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                showToast(data.message || 'Pesan berhasil dikirim!', 'success');
                setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
            } else {
                showToast(data.error || 'Gagal mengirim pesan', 'error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan, silakan coba lagi', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <CartDrawer />
            <main className="flex-1 bg-neutral-50">
                {/* Header */}
                <div className="bg-white border-b border-neutral-100">
                    <div className="container-app py-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary-500 mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Home
                        </Link>
                        <h1 className="text-3xl font-display font-bold text-neutral-800">Hubungi Kami</h1>
                        <p className="text-neutral-500 mt-2">Kami siap membantu Anda</p>
                    </div>
                </div>

                <div className="container-app py-12">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Contact Info */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                                    <MapPin className="w-6 h-6 text-primary-500" />
                                </div>
                                <h3 className="font-semibold text-neutral-800 mb-2">Alamat</h3>
                                <p className="text-neutral-600 text-sm">
                                    {settings.store_address || 'Loading...'}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                                    <Phone className="w-6 h-6 text-primary-500" />
                                </div>
                                <h3 className="font-semibold text-neutral-800 mb-2">WhatsApp</h3>
                                <p className="text-neutral-600 text-sm mb-1">{settings.contact_whatsapp || 'Loading...'}</p>
                                <p className="text-neutral-600 text-sm">{settings.operating_hours || 'Buka Setiap Hari'}</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                                    <MessageCircle className="w-6 h-6 text-primary-500" />
                                </div>
                                <h3 className="font-semibold text-neutral-800 mb-2">WhatsApp</h3>
                                <p className="text-neutral-600 text-sm mb-3">Chat langsung dengan tim kami</p>
                                <Link
                                    href={`https://wa.me/62${settings.contact_whatsapp?.replace(/^0/, '').replace(/-/g, '')}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-2 text-primary-500 hover:underline text-sm"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    {settings.contact_whatsapp || '0851-1945-7138'}
                                </Link>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                                    <Mail className="w-6 h-6 text-primary-500" />
                                </div>
                                <h3 className="font-semibold text-neutral-800 mb-2">Email</h3>
                                <p className="text-neutral-600 text-sm">{settings.contact_email || 'support@infiatin.store'}</p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm p-8">
                                <h2 className="text-2xl font-bold text-neutral-800 mb-2">Kirim Pesan</h2>
                                <p className="text-neutral-500 mb-6">
                                    Isi form di bawah ini dan kami akan segera menghubungi Anda
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Nama Lengkap"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Input
                                            label="Nomor Telepon"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <Input
                                        label="Subjek"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="Contoh: Pertanyaan tentang produk"
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                                            Pesan
                                        </label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows={6}
                                            required
                                            placeholder="Tulis pesan Anda di sini..."
                                            className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:outline-none focus:border-primary-500"
                                        />
                                    </div>

                                    <Button type="submit" fullWidth loading={loading}>
                                        <Send className="w-4 h-4" />
                                        Kirim Pesan
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

