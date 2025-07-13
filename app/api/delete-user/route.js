// app/api/delete-user/route.js
import { NextResponse } from 'next/server';
import { db, admin } from '../../../firebase-admin';

export async function POST(req) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ message: 'User ID (UID) dibutuhkan.' }, { status: 400 });
    }

    // 1. Hapus pengguna dari Firebase Authentication
    await admin.auth().deleteUser(uid);

    // 2. Hapus dokumen pengguna dari Firestore
    await db.collection('users').doc(uid).delete();

    return NextResponse.json({ message: `Pengguna dengan UID ${uid} berhasil dihapus.` }, { status: 200 });

  } catch (error) {
    console.error("Error saat menghapus pengguna:", error);
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan di sistem autentikasi.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}