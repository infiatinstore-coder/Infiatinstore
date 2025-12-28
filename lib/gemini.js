/**
 * Multi-Provider AI Helper (Gemini + Groq + Hugging Face)
 * Library untuk integrasi AI dengan triple fallback
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { HfInference } from '@huggingface/inference';

// Initialize clients
const geminiClient = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const groqClient = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

const hfClient = process.env.HUGGINGFACE_API_KEY
    ? new HfInference(process.env.HUGGINGFACE_API_KEY)
    : null;

// Model configuration
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3';

/**
 * Prompt template untuk generate deskripsi produk
 */
export const PRODUCT_DESCRIPTION_PROMPT = `Kamu adalah copywriter e-commerce profesional untuk toko oleh-oleh haji dan umroh "Infiatin Store".
Buatkan deskripsi produk yang menarik dan persuasif.

NAMA PRODUK: {productName}
KATEGORI: {category}
{additionalInfo}

ATURAN PENTING:
1. Gunakan bahasa Indonesia yang santai tapi profesional
2. Tambahkan emoji yang relevan (maksimal 5-7 emoji, tidak berlebihan)
3. Jika produk Islami (kurma, air zamzam, dll), selipkan hadits/dalil yang relevan
4. Fokus pada manfaat dan value proposition
5. Maksimal 200 kata

FORMAT OUTPUT (WAJIB IKUTI STRUKTUR INI):
[Emoji] [HEADLINE MENARIK - dalam huruf besar]

[Paragraf pembuka yang engaging, 2-3 kalimat]

✨ KEUNGGULAN:
• [keunggulan 1]
• [keunggulan 2]
• [keunggulan 3]
• [keunggulan 4]

🎁 COCOK UNTUK:
• [use case 1]
• [use case 2]
• [use case 3]

[Kalimat penutup yang persuasif dengan call-to-action]`;

/**
 * Generate description using Gemini
 */
async function generateWithGemini(prompt) {
    if (!geminiClient) {
        throw new Error('GEMINI_NOT_CONFIGURED');
    }

    const model = geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
}

/**
 * Generate description using Groq
 */
async function generateWithGroq(prompt) {
    if (!groqClient) {
        throw new Error('GROQ_NOT_CONFIGURED');
    }

    const completion = await groqClient.chat.completions.create({
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
}

/**
 * Generate description using Hugging Face
 */
async function generateWithHuggingFace(prompt) {
    if (!hfClient) {
        throw new Error('HUGGINGFACE_NOT_CONFIGURED');
    }

    const response = await hfClient.textGeneration({
        model: HF_MODEL,
        inputs: prompt,
        parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false,
        },
    });

    return response.generated_text?.trim() || '';
}

/**
 * Generate product description with triple fallback
 * @param {Object} params - Parameters
 * @param {string} params.productName - Product name
 * @param {string} params.category - Product category
 * @param {string} params.additionalInfo - Additional info (optional)
 * @returns {Promise<{description: string, provider: string, model: string}>} Generated description with provider info
 */
export async function generateProductDescription({ productName, category, additionalInfo = '' }) {
    const prompt = PRODUCT_DESCRIPTION_PROMPT
        .replace('{productName}', productName)
        .replace('{category}', category)
        .replace('{additionalInfo}', additionalInfo ? `INFO TAMBAHAN: ${additionalInfo}` : '');

    // Try Gemini first
    if (geminiClient) {
        try {
            console.log('[AI] Trying Gemini...');
            const description = await generateWithGemini(prompt);
            console.log('[AI] ✅ Gemini success');
            return {
                description,
                provider: 'gemini',
                model: GEMINI_MODEL,
            };
        } catch (error) {
            console.log('[AI] ⚠️ Gemini failed:', error.message);
            console.log('[AI] Falling back to next provider...');
        }
    }

    // Fallback to Groq
    if (groqClient) {
        try {
            console.log('[AI] Trying Groq...');
            const description = await generateWithGroq(prompt);
            console.log('[AI] ✅ Groq success');
            return {
                description,
                provider: 'groq',
                model: GROQ_MODEL,
            };
        } catch (error) {
            console.log('[AI] ⚠️ Groq failed:', error.message);
            console.log('[AI] Falling back to Hugging Face...');
        }
    }

    // Final fallback to Hugging Face
    if (hfClient) {
        try {
            console.log('[AI] Trying Hugging Face...');
            const description = await generateWithHuggingFace(prompt);
            console.log('[AI] ✅ Hugging Face success');
            return {
                description,
                provider: 'huggingface',
                model: HF_MODEL,
            };
        } catch (error) {
            console.log('[AI] ⚠️ Hugging Face failed:', error.message);
            throw new Error(`Semua AI provider gagal. Error: ${error.message}`);
        }
    }

    // No provider available
    throw new Error('Tidak ada AI provider yang tersedia. Silakan konfigurasi minimal 1 API Key (Gemini/Groq/Hugging Face).');
}

/**
 * Check if any AI provider is configured
 * @returns {boolean}
 */
export function isAIConfigured() {
    return !!(geminiClient || groqClient || hfClient);
}

/**
 * Get available providers
 * @returns {string[]}
 */
export function getAvailableProviders() {
    const providers = [];
    if (geminiClient) providers.push('gemini');
    if (groqClient) providers.push('groq');
    if (hfClient) providers.push('huggingface');
    return providers;
}

const gemini = {
    generateProductDescription,
    isAIConfigured,
    getAvailableProviders,
    PRODUCT_DESCRIPTION_PROMPT,
};

export default gemini;
