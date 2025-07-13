import * as admin from '@/lib/firebase-admin';

// Objek konfigurasi ini akan membaca environment variables yang sudah Anda siapkan.
// Pastikan variabel FIREBASE_ADMIN_* ada di file .env.local dan di pengaturan Vercel.
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  // Baris ini penting untuk mengubah format kunci dari environment variable
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Cek agar Firebase Admin tidak diinisialisasi berulang kali,
// yang bisa menyebabkan error di lingkungan pengembangan.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK Initialized.');
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error.stack);
  }
}

// Inisialisasi service Firestore dan Auth dari Admin SDK
const db = admin.firestore();
const authAdmin = admin.auth(); // Kita juga ekspor auth untuk manajemen pengguna

// Ekspor service yang dibutuhkan oleh API Routes Anda
export { db, authAdmin, admin };
