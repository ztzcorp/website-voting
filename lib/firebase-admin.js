const admin = require('firebase-admin');

// Pastikan environment variables ada sebelum melanjutkan
if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  // Tidak perlu throw error, cukup log agar tidak membuat build crash
  console.log('Environment variables for Firebase Admin are not set.');
} else {
  // Cek agar tidak inisialisasi berulang kali
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
}

const db = admin.firestore();
const authAdmin = admin.auth();

// Ekspor menggunakan module.exports
module.exports = { db, authAdmin, admin };
