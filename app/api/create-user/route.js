// app/api/create-user/route.js
import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin.js';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ message: 'Email dan password dibutuhkan, password minimal 6 karakter.' }, { status: 400 });
    }

    // 1. Buat user di Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    // 2. Buat dokumen user di Firestore Database
    const userDocRef = db.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      email: email,
      hasVoted: false,
      role: 'user' // Default role adalah 'user'
    });

    return NextResponse.json({ message: `Pengguna ${email} berhasil dibuat.` }, { status: 201 });

  } catch (error) {
    console.error("Error saat membuat pengguna:", error);
    // Memberikan pesan error yang lebih spesifik jika email sudah ada
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ message: 'Email ini sudah terdaftar.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}