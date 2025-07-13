import * as admin from 'firebase-admin';

// Periksa apakah service account sudah ada di environment variables
// Ini mencegah error jika salah satu variabel tidak diatur di Vercel
if (
  !process.env.FIREBASE_ADMIN_PROJECT_ID ||
  !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
  !process.env.FIREBASE_ADMIN_PRIVATE_KEY
) {
  throw new Error('Variabel environment Firebase Admin SDK tidak diatur dengan benar.');
}

const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Cek agar tidak inisialisasi berulang kali
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
const authAdmin = admin.auth();

// Ekspor service yang dibutuhkan oleh API Routes Anda
export { db, authAdmin, admin };
