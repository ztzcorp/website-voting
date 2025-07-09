// app/laporan/page.js
'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig'; // atau '@/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth'; // Impor hook kita

// Komponen untuk ditampilkan jika user bukan admin
const AccessDeniedPage = () => (
  <div className="flex flex-col justify-center items-center min-h-screen text-center p-4">
    <h1 className="text-3xl font-bold">Terima Kasih</h1>
    <p className="mt-2 text-lg">Halaman laporan ini hanya untuk admin.</p>
  </div>
);

// Komponen untuk Halaman Laporan Admin
const AdminReport = () => {
  const [candidates, setCandidates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'candidates'), orderBy('voteCount', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const candidatesData = [];
      querySnapshot.forEach((doc) => {
        candidatesData.push({ id: doc.id, ...doc.data() });
      });
      setCandidates(candidatesData);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (dataLoading) {
    return <p className="text-center mt-10">Memuat data laporan...</p>;
  }

  const maleCandidates = candidates.filter(c => c.gender === 'Laki-laki');
  const femaleCandidates = candidates.filter(c => c.gender === 'Perempuan');

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Manusia Tervaforite Abad Ini</h1>
      <p className="text-center text-green-600 font-semibold mb-8">Hanya bisa diakses oleh Admin</p>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Laporan Laki-laki */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Kategori Laki-laki</h2>
          <div className="space-y-4">
            {maleCandidates.map((candidate, index) => (
              <div key={candidate.id} className="p-4 bg-white rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">{index + 1}. {candidate.name}</span>
                  <span className="text-xl font-bold text-blue-600">{candidate.voteCount} Suara</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Laporan Perempuan */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Kategori Perempuan</h2>
          <div className="space-y-4">
            {femaleCandidates.map((candidate, index) => (
              <div key={candidate.id} className="p-4 bg-white rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">{index + 1}. {candidate.name}</span>
                  <span className="text-xl font-bold text-pink-600">{candidate.voteCount} Suara</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


// Komponen Utama Halaman
export default function ReportPage() {
  const { userProfile, loading: authLoading } = useAuth();

  // Tampilkan pesan loading selagi memeriksa hak akses
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl">Memeriksa hak akses...</p>
      </div>
    );
  }

  // Setelah loading selesai, tentukan komponen yang akan ditampilkan
  if (userProfile && userProfile.role === 'admin') {
    // Jika user adalah admin, tampilkan laporan
    return <AdminReport />;
  } else {
    // Jika bukan admin (atau tidak login), tampilkan halaman "Akses Ditolak"
    return <AccessDeniedPage />;
  }
}