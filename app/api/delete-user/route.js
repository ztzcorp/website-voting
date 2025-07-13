import { NextResponse } from 'next/server';

export async function POST(req) {
  const { db, admin } = require('../../../lib/firebase-admin.js');

  try {
    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ message: 'User ID (UID) dibutuhkan.' }, { status: 400 });
    }
    await admin.auth().deleteUser(uid);
    await db.collection('users').doc(uid).delete();
    return NextResponse.json({ message: `Pengguna berhasil dihapus.` }, { status: 200 });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
