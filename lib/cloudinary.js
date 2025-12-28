import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {string} base64Image - Base64 encoded image
 * @param {string} folder - Folder name in Cloudinary (e.g., 'products', 'avatars')
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadImage(base64Image, folder = 'uploads') {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            throw new Error('Cloudinary not configured');
        }

        const result = await cloudinary.uploader.upload(base64Image, {
            folder: `infiya-store/${folder}`,
            resource_type: 'image',
            transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
            ],
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image');
    }
}

/**
 * Upload multiple images
 * @param {Array<string>} base64Images - Array of base64 images
 * @param {string} folder - Folder name
 * @returns {Promise<Array<{url: string, publicId: string}>>}
 */
export async function uploadMultipleImages(base64Images, folder = 'uploads') {
    try {
        const uploadPromises = base64Images.map((base64Image) =>
            uploadImage(base64Image, folder)
        );
        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error('Multiple upload error:', error);
        throw new Error('Failed to upload images');
    }
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of image to delete
 */
export async function deleteImage(publicId) {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            console.warn('Cloudinary not configured, skipping delete');
            return;
        }

        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Image deleted:', publicId, result);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete image');
    }
}

/**
 * Delete multiple images
 * @param {Array<string>} publicIds - Array of public IDs
 */
/**
 * Delete multiple images
 * @param {Array<string>} publicIds - Array of public IDs
 */
export async function deleteMultipleImages(publicIds) {
    try {
        const deletePromises = publicIds.map((publicId) => deleteImage(publicId));
        return await Promise.all(deletePromises);
    } catch (error) {
        console.error('Multiple delete error:', error);
        throw new Error('Failed to delete images');
    }
}

/**
 * Upload buffer to Cloudinary (for file uploads)
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export async function uploadToCloudinary(buffer, options = {}) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder || 'infiya-store/uploads',
                transformation: options.transformation || [],
                resource_type: options.resource_type || 'image',
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload stream error:', error);
                    reject(new Error('Failed to upload to Cloudinary'));
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.end(buffer);
    });
}

/**
 * Delete image from Cloudinary by URL
 * @param {string} imageUrl - Full Cloudinary image URL
 */
export async function deleteFromCloudinary(imageUrl) {
    try {
        // Extract public_id from URL
        // Example: https://res.cloudinary.com/xxx/image/upload/v123/folder/image.jpg
        // Extract: folder/image
        const urlParts = imageUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');

        if (uploadIndex === -1) {
            throw new Error('Invalid Cloudinary URL');
        }

        // Get everything after 'upload/v{version}/' or 'upload/'
        let publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');

        // Remove file extension
        const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

        return await deleteImage(publicId);
    } catch (error) {
        console.error('Delete from Cloudinary error:', error);
        throw error;
    }
}


export default cloudinary;
