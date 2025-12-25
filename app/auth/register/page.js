'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import useUserStore from '@/store/user';

export default function RegisterPage() {
    const router = useRouter();
    const { setUser } = useUserStore();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nama wajib diisi';
        }

        // Email OR Phone required (at least one)
        const hasEmail = formData.email && formData.email.trim();
        const hasPhone = formData.phone && formData.phone.trim();

        if (!hasEmail && !hasPhone) {
            newErrors.email = 'Email atau nomor WhatsApp wajib diisi';
            newErrors.phone = 'Email atau nomor WhatsApp wajib diisi';
        } else {
            // Validate email if provided
            if (hasEmail && !/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Format email tidak valid';
            }

            // Validate phone if provided
            if (hasPhone && !/^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(formData.phone.replace(/\s/g, ''))) {
                newErrors.phone = 'Format nomor WhatsApp tidak valid';
            }
        }

        if (!formData.password) {
            newErrors.password = 'Password wajib diisi';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password minimal 8 karakter';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Password tidak cocok';
        }

        if (!formData.agreeTerms) {
            newErrors.agreeTerms = 'Anda harus menyetujui syarat & ketentuan';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setErrors({});

        try {
            // Call real registration API
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important: Send/receive cookies
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrors({ submit: data.error || 'Gagal mendaftar. Silakan coba lagi.' });
                return;
            }

            // Handle success based on registration type
            if (data.user.status === 'UNVERIFIED') {
                // Registration requires verification
                if (formData.phone && !formData.email) {
                    // Phone-only registration → WhatsApp OTP verification
                    alert('✅ ' + data.message + '\n\nSilakan cek WhatsApp Anda untuk kode verifikasi.');
                    router.push(`/auth/verify-otp?phone=${encodeURIComponent(formData.phone)}`);
                } else if (formData.email) {
                    // Email registration → Email verification
                    alert('✅ ' + data.message);
                    router.push('/'); // Or create a "check your email" page
                }
            } else {
                // User is already ACTIVE (email + phone registration)
                setUser(data.user, data.token);
                alert('✅ Registrasi berhasil! Selamat datang di Infiatin Store 🎉');
                router.push('/');
            }
        } catch (error) {
            console.error('Registration error:', error);
            setErrors({ submit: 'Terjadi kesalahan jaringan. Silakan coba lagi.' });
        } finally {
            setLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const strengthLabels = ['', 'Sangat Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
    const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-secondary-500', 'bg-secondary-600'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">i</span>
                    </div>
                    <span className="font-display text-2xl font-bold text-neutral-800">
                        Infiatin<span className="text-primary-500">Store</span>
                    </span>
                </Link>

                {/* Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-xl md:text-2xl font-display font-bold text-neutral-800 mb-2">
                            Buat Akun Baru 🎉
                        </h1>
                        <p className="text-sm md:text-base text-neutral-500">
                            Daftar untuk mulai berbelanja dengan penawaran eksklusif
                        </p>
                    </div>

                    {errors.submit && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
                            {errors.submit}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Nama Lengkap"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nama lengkap Anda"
                            leftIcon={<User className="w-5 h-5" />}
                            error={errors.name}
                        />

                        {/* Info Note */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-700">
                                💡 <strong>Minimal isi salah satu:</strong> Email atau Nomor WhatsApp untuk verifikasi akun
                            </p>
                        </div>

                        <Input
                            label="Email (opsional)"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="nama@email.com"
                            leftIcon={<Mail className="w-5 h-5" />}
                            error={errors.email}
                        />

                        <Input
                            label="Nomor WhatsApp (opsional)"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="08xxxxxxxxxx"
                            leftIcon={<Phone className="w-5 h-5" />}
                            error={errors.phone}
                        />

                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Minimal 8 karakter"
                                leftIcon={<Lock className="w-5 h-5" />}
                                error={errors.password}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {formData.password && (
                            <div className="space-y-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength >= i ? strengthColors[passwordStrength] : 'bg-neutral-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-neutral-500">
                                    Kekuatan password: <span className={passwordStrength >= 4 ? 'text-secondary-600' : 'text-neutral-600'}>{strengthLabels[passwordStrength]}</span>
                                </p>
                            </div>
                        )}

                        <Input
                            label="Konfirmasi Password"
                            type={showPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Ulangi password"
                            leftIcon={<Lock className="w-5 h-5" />}
                            error={errors.confirmPassword}
                        />

                        <div className="space-y-1">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="agreeTerms"
                                    checked={formData.agreeTerms}
                                    onChange={handleChange}
                                    className="w-5 h-5 mt-0.5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                                />
                                <span className="text-sm text-neutral-600">
                                    Saya menyetujui{' '}
                                    <Link href="/terms" className="text-primary-500 hover:underline">Syarat & Ketentuan</Link>
                                    {' '}dan{' '}
                                    <Link href="/privacy" className="text-primary-500 hover:underline">Kebijakan Privasi</Link>
                                </span>
                            </label>
                            {errors.agreeTerms && (
                                <p className="text-sm text-red-500">{errors.agreeTerms}</p>
                            )}
                        </div>

                        <Button type="submit" fullWidth size="lg" loading={loading}>
                            Daftar Sekarang
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-neutral-500">
                            Sudah punya akun?{' '}
                            <Link href="/auth/login" className="text-primary-500 font-semibold hover:underline">
                                Masuk di sini
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Benefits */}
                <div className="mt-6 bg-white/50 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-sm font-medium text-neutral-700 mb-3 text-center">Keuntungan mendaftar:</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                            'Gratis ongkir pembelian pertama',
                            'Promo eksklusif member',
                            'Poin setiap belanja',
                            'Tracking pesanan mudah',
                        ].map((benefit, i) => (
                            <div key={i} className="flex items-center gap-2 text-neutral-600">
                                <Check className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
