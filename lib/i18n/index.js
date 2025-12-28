/**
 * i18n (Internationalization) Helper
 * Multi-language support for the application
 */

import en from './locales/en.json';
import id from './locales/id.json';

const translations = {
    en,
    id
};

export const defaultLocale = 'id'; // Indonesian default
export const locales = ['id', 'en'];

/**
 * Get translation for a key
 * @param {string} locale - Language code (id, en)
 * @param {string} key - Translation key (e.g., 'common.welcome')
 * @param {object} params - Parameters to replace in translation
 * @returns {string} Translated text
 */
export function t(locale, key, params = {}) {
    const lang = translations[locale] || translations[defaultLocale];

    // Navigate through nested keys (e.g., 'common.welcome')
    const keys = key.split('.');
    let value = lang;

    for (const k of keys) {
        value = value?.[k];
        if (!value) break;
    }

    // If translation not found, return key
    if (!value) {
        console.warn(`Translation missing for key: ${key} in locale: ${locale}`);
        return key;
    }

    // Replace parameters in translation
    let result = value;
    Object.entries(params).forEach(([param, val]) => {
        result = result.replace(`{${param}}`, val);
    });

    return result;
}

/**
 * Get current locale from cookies or browser
 * @param {Request} request - Next.js request object
 * @returns {string} Current locale code
 */
export function getLocale(request) {
    if (!request) return defaultLocale;

    // Try to get from cookie
    const cookies = request.cookies;
    const localeCookie = cookies?.get('locale')?.value;

    if (localeCookie && locales.includes(localeCookie)) {
        return localeCookie;
    }

    // Try to get from Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
        const langs = acceptLanguage.split(',').map(lang => lang.split(';')[0].trim());
        for (const lang of langs) {
            const locale = lang.split('-')[0]; // Extract language code
            if (locales.includes(locale)) {
                return locale;
            }
        }
    }

    return defaultLocale;
}

/**
 * Create translator function for specific locale
 * @param {string} locale - Language code
 * @returns {Function} Translation function
 */
export function createTranslator(locale) {
    return (key, params) => t(locale, key, params);
}

const i18n = {
    t,
    getLocale,
    createTranslator,
    defaultLocale,
    locales
};

export default i18n;
