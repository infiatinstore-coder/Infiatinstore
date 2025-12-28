'use client';

import Link from 'next/link';
import { Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

const footerLinks = {
    products: [
        { name: 'Kurma Premium', href: '/products?category=kurma-buah-kering' },
        { name: 'Air Zamzam', href: '/products?category=air-zamzam' },
        { name: 'Kacang & Camilan', href: '/products?category=kacang-camilan' },
        { name: 'Perlengkapan Ibadah', href: '/products?category=perlengkapan-ibadah' },
        { name: 'Paket Oleh-Oleh', href: '/products?category=paket-oleh-oleh' },
    ],
    customer: [
        { name: 'Bantuan & FAQ', href: '/help' },
        { name: 'Kebijakan Refund', href: '/refund-policy' },
    ],
    company: [
        { name: 'Tentang Kami', href: '/about' },
        { name: 'Kontak', href: '/contact' },
    ],
    legal: [
        { name: 'Syarat & Ketentuan', href: '/terms' },
        { name: 'Kebijakan Privasi', href: '/privacy' },
    ],
};

export default function Footer() {
    return (
        <footer className="bg-neutral-900 text-neutral-300 mt-auto">
            {/* Trust Badges */}
            <div className="border-b border-neutral-800">
                <div className="container-app py-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">🛡️</span>
                            </div>
                            <div>
                                <p className="font-semibold text-white">Produk Original</p>
                                <p className="text-sm text-neutral-400">Garansi 100%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">🚚</span>
                            </div>
                            <div>
                                <p className="font-semibold text-white">Gratis Ongkir</p>
                                <p className="text-sm text-neutral-400">Min. belanja 200rb</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">🔄</span>
                            </div>
                            <div>
                                <p className="font-semibold text-white">Easy Return</p>
                                <p className="text-sm text-neutral-400">7 hari pengembalian</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <div>
                                <p className="font-semibold text-white">Pembayaran Aman</p>
                                <p className="text-sm text-neutral-400">100% terenkripsi</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="container-app py-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                    <div className="col-span-2 md:col-span-3 lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-sm">
                                <img src="/logo-infiatin.png" alt="Infiatin Store" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-display text-xl font-bold text-white">
                                Infiatin<span className="text-primary-500">Store</span>
                            </span>
                        </Link>
                        <p className="text-neutral-400 mb-2 max-w-sm font-medium text-primary-400">
                            Dekat & Bersahabat
                        </p>
                        <p className="text-neutral-400 mb-6 max-w-sm text-sm">
                            Pusat Kurma & Oleh-Oleh Haji terlengkap di Sidareja. Menyediakan produk berkualitas dengan harga terbaik untuk kebutuhan Ramadhan Anda.
                        </p>
                        <div className="space-y-2 text-sm">
                            <a href="https://wa.me/6285119467138" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary-500 transition-colors">
                                <Phone className="w-4 h-4" />
                                0851-1946-7138 (WhatsApp)
                            </a>
                            <p className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>GQ7C+793, Cikomprang, Desa Tegalsari, Sidareja, Cilacap, Jawa Tengah 53261</span>
                            </p>
                            <p className="flex items-center gap-2 text-primary-400">
                                🕐 Buka Setiap Hari: 06.30 – 21.00 WIB
                            </p>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Produk</h4>
                        <ul className="space-y-2">
                            {footerLinks.products.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm hover:text-primary-500 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Bantuan</h4>
                        <ul className="space-y-2">
                            {footerLinks.customer.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm hover:text-primary-500 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Perusahaan</h4>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm hover:text-primary-500 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social Media - NO NEWSLETTER */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Ikuti Kami</h4>
                        <div className="flex gap-3">
                            <a
                                href="https://instagram.com/infiatinstore"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-primary-500 transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="https://facebook.com/infiatinstore"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-primary-500 transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a
                                href="https://twitter.com/infiatinstore"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-primary-500 transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-neutral-800">
                <div className="container-app py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-neutral-400">
                        © {new Date().getFullYear()} Infiatin Store. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                        {footerLinks.legal.map((link) => (
                            <Link key={link.name} href={link.href} className="hover:text-primary-500 transition-colors">
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
