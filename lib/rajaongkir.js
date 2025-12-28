/**
 * RajaOngkir API Client for shipping cost calculation
 * API Documentation: https://rajaongkir.com/dokumentasi
 */

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
const RAJAONGKIR_BASE_URL = process.env.RAJAONGKIR_ACCOUNT_TYPE === 'pro'
    ? 'https://pro.rajaongkir.com/api'
    : 'https://api.rajaongkir.com/starter';

/**
 * Get list of provinces
 */
export async function getProvinces() {
    try {
        const response = await fetch(`${RAJAONGKIR_BASE_URL}/province`, {
            headers: {
                'key': RAJAONGKIR_API_KEY,
            },
        });

        const data = await response.json();

        if (data.rajaongkir.status.code !== 200) {
            throw new Error(data.rajaongkir.status.description);
        }

        return data.rajaongkir.results;
    } catch (error) {
        console.error('RajaOngkir getProvinces error:', error);
        throw new Error('Failed to fetch provinces');
    }
}

/**
 * Get list of cities by province
 */
export async function getCities(provinceId) {
    try {
        const url = provinceId
            ? `${RAJAONGKIR_BASE_URL}/city?province=${provinceId}`
            : `${RAJAONGKIR_BASE_URL}/city`;

        const response = await fetch(url, {
            headers: {
                'key': RAJAONGKIR_API_KEY,
            },
        });

        const data = await response.json();

        if (data.rajaongkir.status.code !== 200) {
            throw new Error(data.rajaongkir.status.description);
        }

        return data.rajaongkir.results;
    } catch (error) {
        console.error('RajaOngkir getCities error:', error);
        throw new Error('Failed to fetch cities');
    }
}

/**
 * Calculate shipping cost
 * @param {Object} params - Shipping parameters
 * @param {string} params.origin - Origin city ID
 * @param {string} params.destination - Destination city ID
 * @param {number} params.weight - Weight in grams
 * @param {string} params.courier - Courier code (jne, pos, tiki, etc)
 */
export async function calculateShippingCost({ origin, destination, weight, courier }) {
    try {
        if (!RAJAONGKIR_API_KEY) {
            throw new Error('RajaOngkir API key not configured');
        }

        const response = await fetch(`${RAJAONGKIR_BASE_URL}/cost`, {
            method: 'POST',
            headers: {
                'key': RAJAONGKIR_API_KEY,
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                origin: origin.toString(),
                destination: destination.toString(),
                weight: weight.toString(),
                courier: courier.toLowerCase(),
            }),
        });

        const data = await response.json();

        if (data.rajaongkir.status.code !== 200) {
            throw new Error(data.rajaongkir.status.description);
        }

        return data.rajaongkir.results;
    } catch (error) {
        console.error('RajaOngkir calculateShippingCost error:', error);
        throw new Error('Failed to calculate shipping cost');
    }
}

// Note: The real trackWaybill implementation is moved below (line 182+)
// This section was a duplicate that has been removed to fix build errors

/**
 * Get multiple courier costs at once
 * @param {Object} params - Shipping parameters
 * @param {string} params.origin - Origin city ID
 * @param {string} params.destination - Destination city ID  
 * @param {number} params.weight - Weight in grams
 * @param {Array<string>} params.couriers - Array of courier codes ['jne', 'pos', 'tiki']
 */
export async function getMultipleCourierCosts({ origin, destination, weight, couriers }) {
    try {
        // RajaOngkir allows checking multiple couriers in one request with ':' separator
        const courierString = couriers.join(':');

        const response = await fetch(`${RAJAONGKIR_BASE_URL}/cost`, {
            method: 'POST',
            headers: {
                'key': RAJAONGKIR_API_KEY,
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                origin: origin.toString(),
                destination: destination.toString(),
                weight: weight.toString(),
                courier: courierString,
            }),
        });

        const data = await response.json();

        if (data.rajaongkir.status.code !== 200) {
            throw new Error(data.rajaongkir.status.description);
        }

        return data.rajaongkir.results;
    } catch (error) {
        console.error('RajaOngkir getMultipleCourierCosts error:', error);
        throw new Error('Failed to fetch multiple courier costs');
    }
}

/**
 * Track waybill/shipment status
 * Note: This requires RajaOngkir Pro account for real tracking
 * Starter account does NOT support waybill tracking
 * @param {string} waybill - Tracking number
 * @param {string} courier - Courier code (jne, jnt, sicepat, etc)
 */
export async function trackWaybill(waybill, courier) {
    // RajaOngkir Starter does NOT support waybill tracking
    // This is a mock implementation that simulates tracking
    console.log(`[RajaOngkir] Tracking waybill: ${waybill} via ${courier}`);

    // If you have Pro account, uncomment this:
    /*
    try {
        const response = await fetch(`https://pro.rajaongkir.com/api/waybill`, {
            method: 'POST',
            headers: {
                'key': RAJAONGKIR_API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                waybill: waybill,
                courier: courier,
            }),
        });

        const data = await response.json();

        if (data.rajaongkir.status.code !== 200) {
            throw new Error(data.rajaongkir.status.description);
        }

        return data.rajaongkir.result;
    } catch (error) {
        console.error('RajaOngkir trackWaybill error:', error);
        throw new Error('Gagal melacak pengiriman: ' + error.message);
    }
    */

    // Mock response for Starter account
    // In production, integrate with actual courier APIs or upgrade to Pro
    return {
        delivered: false,
        summary: {
            courier_code: courier.toUpperCase(),
            courier_name: courier.toUpperCase(),
            waybill_number: waybill,
            service_code: 'REG',
            waybill_date: new Date().toISOString().split('T')[0],
            shipper_name: 'Infiatin Store',
            receiver_name: 'Pelanggan',
            origin: 'Cilacap',
            destination: '-',
            status: 'TRANSIT',
        },
        manifest: [
            {
                manifest_code: '3',
                manifest_description: 'Paket dalam proses pengiriman',
                manifest_date: new Date().toISOString().split('T')[0],
                manifest_time: '10:00',
                city_name: 'Hub Transit',
            },
            {
                manifest_code: '2',
                manifest_description: 'Paket telah dikirim dari gudang pengirim',
                manifest_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                manifest_time: '14:30',
                city_name: 'Cilacap',
            },
            {
                manifest_code: '1',
                manifest_description: 'Paket diterima oleh kurir',
                manifest_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
                manifest_time: '09:15',
                city_name: 'Cilacap',
            },
        ],
        delivery_status: {
            status: 'TRANSIT',
            pod_receiver: '',
            pod_date: '',
            pod_time: '',
        },
    };
}

/**
 * Format shipping cost results for frontend
 */
export function formatShippingCosts(rajaOngkirResults) {
    const formatted = [];

    rajaOngkirResults.forEach((courierData) => {
        const courierCode = courierData.code;
        const courierName = courierData.name;

        courierData.costs.forEach((cost) => {
            formatted.push({
                courier: courierCode.toUpperCase(),
                courierName: courierName,
                service: cost.service,
                description: cost.description,
                cost: cost.cost[0].value,
                etd: cost.cost[0].etd,
                note: cost.cost[0].note || '',
            });
        });
    });

    return formatted;
}

/**
 * Get popular couriers for quick selection
 */
export const POPULAR_COURIERS = [
    { code: 'jne', name: 'JNE' },
    { code: 'pos', name: 'POS Indonesia' },
    { code: 'tiki', name: 'TIKI' },
    { code: 'jnt', name: 'J&T Express' },
    { code: 'sicepat', name: 'SiCepat' },
    { code: 'anteraja', name: 'AnterAja' },
];

// Default origin (Your store location - Cilacap)
export const DEFAULT_ORIGIN_CITY_ID = '76'; // Cilacap
// Update this with your actual store city ID from RajaOngkir
