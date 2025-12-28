'use client';

import { useState, useEffect } from 'react';

/**
 * Language Switcher Component
 * Switch between Indonesian and English
 */
export default function LanguageSwitcher({ className = '' }) {
    const [locale, setLocale] = useState('id');
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
        { code: 'en', name: 'English', flag: '🇬🇧' }
    ];

    useEffect(() => {
        // Get saved locale from cookie
        const savedLocale = document.cookie
            .split('; ')
            .find(row => row.startsWith('locale='))
            ?.split('=')[1];

        if (savedLocale) {
            setLocale(savedLocale);
        }
    }, []);

    const switchLanguage = (newLocale) => {
        setLocale(newLocale);
        setIsOpen(false);

        // Save to cookie (expires in 1 year)
        document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;

        // Reload page to apply new language
        window.location.reload();
    };

    const currentLanguage = languages.find(l => l.code === locale);

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
                <span className="text-lg">{currentLanguage?.flag}</span>
                <span className="text-sm font-medium">{currentLanguage?.code.toUpperCase()}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[150px]">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => switchLanguage(lang.code)}
                                className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition first:rounded-t-lg last:rounded-b-lg ${locale === lang.code ? 'bg-emerald-50 text-emerald-700' : ''
                                    }`}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span className="text-sm">{lang.name}</span>
                                {locale === lang.code && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-auto text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
