import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const updates = [
    {
        slug: 'bukhur-oud-asli-premium',
        description: `🔥 BUKHUR OUD PREMIUM - Wewangian Mewah Khas Timur Tengah

Dupa oud asli Arab dengan aroma yang mewah dan khas. Sempurna untuk mengharumkan rumah, tempat ibadah, atau ruangan spesial.

✨ KEUNGGULAN:
• Oud asli kualitas premium
• Aroma mewah, hangat, dan tahan lama
• Cocok untuk semua ruangan
• Kemasan box eksklusif

🎁 COCOK UNTUK:
• Mengharumkan rumah
• Acara keagamaan
• Hadiah spesial

📦 Isi: 50 gram dupa oud premium`
    },
    {
        slug: 'kacang-arab-panggang-500g',
        description: `🥜 KACANG ARAB PANGGANG RENYAH - Camilan Sehat Khas Timur Tengah

Kacang arab gurih dan renyah dengan bumbu khas Timur Tengah. Dipanggang sempurna untuk rasa yang maksimal!

✨ KEUNGGULAN:
• Kualitas premium grade A
• Renyah dan gurih sempurna
• Tanpa pengawet
• Tanpa MSG
• Kemasan praktis 500g

💡 MANFAAT:
• Sumber protein nabati
• Kaya serat
• Camilan sehat

🎁 Cocok untuk: Oleh-oleh, camilan keluarga, atau dijual kembali`
    },
    {
        slug: 'kacang-pistachio-premium-500g',
        description: `🌰 KACANG PISTACHIO PREMIUM - Raja Kacang dari Timur Tengah

Kacang pistachio berkualitas tinggi dengan rasa gurih-manis yang khas. Camilan mewah yang sehat dan lezat!

✨ KEUNGGULAN:
• Pistachio premium grade A
• Ukuran besar dan seragam
• Cangkang terbuka natural
• Rasa gurih-manis sempurna
• Kemasan 500g

💡 MANFAAT KESEHATAN:
• Kaya antioksidan
• Sumber protein dan serat
• Baik untuk jantung
• Membantu menurunkan kolesterol

🎁 Cocok untuk: Camilan sehat, baking, atau hadiah`
    },
    {
        slug: 'peci-hitam-premium-songkok',
        description: `🎩 PECI SONGKOK HITAM PREMIUM - Peci Berkualitas untuk Ibadah

Peci hitam berkualitas tinggi dengan bahan beludru halus. Nyaman digunakan untuk ibadah sehari-hari maupun acara formal.

✨ KEUNGGULAN:
• Bahan beludru premium super halus
• Warna hitam pekat tidak mudah pudar
• Nyaman dan tidak panas
• Jahitan rapi dan kuat
• Berbagai ukuran tersedia (S/M/L/XL)

📏 UKURAN:
• S: Lingkar 54 cm
• M: Lingkar 56 cm  
• L: Lingkar 58 cm
• XL: Lingkar 60 cm

🎁 Cocok untuk: Ibadah harian, Jumat, Lebaran, acara formal`
    }
];

async function updateDescriptions() {
    console.log('Updating product descriptions...\n');

    for (const item of updates) {
        try {
            const result = await p.product.updateMany({
                where: { slug: item.slug },
                data: { description: item.description }
            });

            if (result.count > 0) {
                console.log(`✅ Updated: ${item.slug}`);
            } else {
                console.log(`⚠️ Not found: ${item.slug}`);
            }
        } catch (e) {
            console.log(`❌ Error: ${item.slug} - ${e.message}`);
        }
    }

    console.log('\nDone!');
    await p.$disconnect();
}

updateDescriptions();
