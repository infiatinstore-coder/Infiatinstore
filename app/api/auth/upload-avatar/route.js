import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';

import { verifyAuth } from '@/lib/auth';

import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';


/**
 * POST /api/auth/upload-avatar
 * Upload user avatar to Cloudinary
 */
export async function POST(request) {
    try {
        // Verify authentication
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('avatar');

        if (!file) {
            return NextResponse.json(
                { error: 'File avatar diperlukan' },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Format file tidak valid. Gunakan JPG, PNG, atau WEBP' },
                { status: 400 }
            );
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'Ukuran file terlalu besar. Maksimal 2MB' },
                { status: 400 }
            );
        }

        // Get current user
        const user = await prisma.users.findUnique({
            where: { id: auth.users.id },
            select: { id: true, avatar_url: true }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User tidak ditemukan' },
                { status: 404 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(
            buffer,
            {
                folder: 'infiatin-store/avatars',
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            }
        );

        // Delete old avatar from Cloudinary if exists
        if (user.avatar_url) {
            try {
                await deleteFromCloudinary(user.avatar_url);
            } catch (error) {
                console.error('Failed to delete old avatar:', error);
                // Continue anyway, not critical
            }
        }

        // Update user avatar URL
        await prisma.users.update({
            where: { id: user.id },
            data: { avatar_url: uploadResult.secure_url }
        });

        console.log('✅ Avatar uploaded for users:', user.id);

        return NextResponse.json({
            success: true,
            message: 'Avatar berhasil diupload',
            avatar_url: uploadResult.secure_url
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        return NextResponse.json(
            { error: 'Gagal mengupload avatar' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/auth/upload-avatar
 * Remove user avatar
 */
export async function DELETE(request) {
    try {
        // Verify authentication
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get current user
        const user = await prisma.users.findUnique({
            where: { id: auth.users.id },
            select: { id: true, avatar_url: true }
        });

        if (!user || !user.avatar_url) {
            return NextResponse.json(
                { error: 'Tidak ada avatar untuk dihapus' },
                { status: 400 }
            );
        }

        // Delete from Cloudinary
        try {
            await deleteFromCloudinary(user.avatar_url);
        } catch (error) {
            console.error('Failed to delete avatar from Cloudinary:', error);
        }

        // Update user
        await prisma.users.update({
            where: { id: user.id },
            data: { avatar_url: null }
        });

        console.log('✅ Avatar removed for users:', user.id);

        return NextResponse.json({
            success: true,
            message: 'Avatar berhasil dihapus'
        });
    } catch (error) {
        console.error('Delete avatar error:', error);
        return NextResponse.json(
            { error: 'Gagal menghapus avatar' },
            { status: 500 }
        );
    }
}

