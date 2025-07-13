import { NextResponse } from 'next/server';

export async function POST(req) {
  // Muat modul admin di sini, bukan di atas
  const { db, admin } = require('../../../lib/firebase-admin.js');

  try {
    const { email, password } = await req.json();
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ message: 'Email dan password dibutuhkan (min 6 karakter).' }, { status: 400 });
    }

    const userRecord = await admin.auth().createUser({ email, password });
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      hasVoted: false,
      role: 'user'
    });
    return NextResponse.json({ message: `Pengguna ${email} berhasil dibuat.` }, { status: 201 });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ message: 'Email ini sudah terdaftar.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
