import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin.js';

/**
 * API Route untuk menangani permintaan POST untuk mengedit data autentikasi pengguna (email/password).
 * Ini adalah aksi yang dilindungi dan hanya boleh dipicu oleh admin.
 */
export async function POST(req) {
  try {
    const { uid, email, password } = await req.json();

    if (!uid) {
      return NextResponse.json({ message: 'User ID (UID) dibutuhkan.' }, { status: 400 });
    }

    const updatePayload = {};
    if (email) {
      updatePayload.email = email;
    }
    if (password) {
        if (password.length < 6) {
            return NextResponse.json({ message: 'Password baru minimal 6 karakter.' }, { status: 400 });
        }
        updatePayload.password = password;
    }

    // 1. Update pengguna di Firebase Authentication jika ada perubahan email/password
    if (Object.keys(updatePayload).length > 0) {
        await admin.auth().updateUser(uid, updatePayload);
    }

    // 2. Jika email diubah, update juga di koleksi Firestore 'users'
    if (email) {
        await db.collection('users').doc(uid).update({ email: email });
    }

    return NextResponse.json({ message: `Data autentikasi pengguna berhasil diperbarui.` }, { status: 200 });

  } catch (error) {
    console.error("Error saat update pengguna:", error);
    if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ message: 'Email baru sudah digunakan oleh pengguna lain.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan internal saat memperbarui pengguna.' }, { status: 500 });
  }
}
