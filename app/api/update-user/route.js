import { NextResponse } from 'next/server';

export async function POST(req) {
  const { db, admin } = require('../../../lib/firebase-admin.js');

  try {
    const { uid, email, password } = await req.json();
    if (!uid) {
      return NextResponse.json({ message: 'User ID (UID) dibutuhkan.' }, { status: 400 });
    }
    const updatePayload = {};
    if (email) updatePayload.email = email;
    if (password) {
        if (password.length < 6) return NextResponse.json({ message: 'Password baru minimal 6 karakter.' }, { status: 400 });
        updatePayload.password = password;
    }
    if (Object.keys(updatePayload).length > 0) {
        await admin.auth().updateUser(uid, updatePayload);
    }
    if (email) {
        await db.collection('users').doc(uid).update({ email: email });
    }
    return NextResponse.json({ message: `Data autentikasi pengguna berhasil diperbarui.` }, { status: 200 });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ message: 'Email baru sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
