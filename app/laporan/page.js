'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, orderBy, writeBatch, getDocs } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

// Komponen untuk Tampilan Akses Ditolak
const AccessDeniedPage = () => (
  <main className="flex flex-col justify-center items-center min-h-screen text-center p-4">
    <div className="card p-10 max-w-lg">
      <h1 className="text-3xl font-bold text-red-600">Akses Ditolak</h1>
      <p className="mt-2 text-slate-600">Halaman laporan ini hanya dapat diakses oleh Admin.</p>
    </div>
  </main>
);

// Komponen untuk Tampilan Laporan Admin
// Ganti HANYA komponen AdminReport di file app/laporan/page.js

const AdminReport = () => {
  const [candidates, setCandidates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'candidates'), orderBy('voteCount', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let total = 0;
      const candidatesData = querySnapshot.docs.map((doc) => {
        total += doc.data().voteCount;
        return { id: doc.id, ...doc.data() };
      });
      setCandidates(candidatesData);
      setTotalVotes(total / 2);
      setDataLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleReset = async () => {
    const confirmationText = "APAKAH ANDA YAKIN INGIN MERESET SEMUA DATA VOTING?\n\nSemua jumlah suara kandidat akan menjadi 0 dan semua status pemilih akan diatur ulang. Aksi ini tidak bisa dibatalkan!";
    
    if (window.confirm(confirmationText)) {
      setResetLoading(true);
      try {
        const batch = writeBatch(db);

        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => {
          batch.update(doc.ref, { hasVoted: false });
        });

        const candidatesQuery = query(collection(db, 'candidates'));
        const candidatesSnapshot = await getDocs(candidatesQuery);
        candidatesSnapshot.forEach(doc => {
          batch.update(doc.ref, { voteCount: 0 });
        });

        await batch.commit();
        alert("Sukses! Data telah berhasil di-reset.");
      } catch (error) {
        console.error("Client-side Reset Error:", error);
        alert(`Error: ${error.message}`);
      } finally {
        setResetLoading(false);
      }
    }
  };

  if (dataLoading) {
    return <p className="text-center mt-10">Memuat data laporan...</p>;
  }

  const maleCandidates = candidates.filter(c => c.gender === 'Laki-laki');
  const femaleCandidates = candidates.filter(c => c.gender === 'Perempuan');
  
  const getPercentage = (count) => (totalVotes > 0 ? (count / totalVotes) * 100 : 0);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">FAVORIT NIH</h1>
        <p className="mt-2 text-lg text-slate-600">Total Suara Masuk: <span className="font-bold text-indigo-600">{Math.round(totalVotes)}</span></p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Kartu Laporan Laki-laki */}
        <section className="card p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Kategori Laki-laki</h2>
          <div className="space-y-6">
            {maleCandidates.map((candidate) => (
              <div key={candidate.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-lg">{candidate.name}</span>
                  <span className="text-lg font-bold text-indigo-600">{candidate.voteCount} Suara</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${getPercentage(candidate.voteCount)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Kartu Laporan Perempuan */}
        <section className="card p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Kategori Perempuan</h2>
          <div className="space-y-6">
            {femaleCandidates.map((candidate) => (
              <div key={candidate.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-lg">{candidate.name}</span>
                  <span className="text-lg font-bold text-indigo-600">{candidate.voteCount} Suara</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div className="bg-pink-500 h-4 rounded-full" style={{ width: `${getPercentage(candidate.voteCount)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bagian Tombol Reset (Tanpa Zona Berbahaya) */}
      <footer className="mt-12 text-center">
        <button
          onClick={handleReset}
          disabled={resetLoading}
          className="px-8 py-3 font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {resetLoading ? 'Memproses...' : 'Reset Semua Data Voting'}
        </button>
      </footer>
    </main>
  );
};


// Komponen Utama Halaman
export default function ReportPage() {
  const { userProfile, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl">Memeriksa hak akses...</p>
      </div>
    );
  }

  if (userProfile && userProfile.role === 'admin') {
    return <AdminReport />;
  } else {
    return <AccessDeniedPage />;
  }
}