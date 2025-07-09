// app/vote/page.js
'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, doc, runTransaction } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function VotePage() {
  // State untuk data kandidat
  const [maleCandidates, setMaleCandidates] = useState([]);
  const [femaleCandidates, setFemaleCandidates] = useState([]);
  
  // State untuk pilihan user
  const [selectedMale, setSelectedMale] = useState(null);
  const [selectedFemale, setSelectedFemale] = useState(null);
  
  // State untuk UI feedback
  const [message, setMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [voteCompleted, setVoteCompleted] = useState(false); // <-- State baru
  
  const { authUser, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect jika belum login
  useEffect(() => {
    if (authLoading) return; 

    if (!authUser) {
      router.push('/login');
    }
  }, [authUser, authLoading, router]);

  // Ambil data kandidat dari Firestore
  useEffect(() => {
    const fetchCandidates = async () => {
      const querySnapshot = await getDocs(collection(db, 'candidates'));
      const candidatesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaleCandidates(candidatesData.filter(c => c.gender === 'Laki-laki'));
      setFemaleCandidates(candidatesData.filter(c => c.gender === 'Perempuan'));
    };
    fetchCandidates();
  }, []);

  // Fungsi submit vote yang diperbarui
  const handleSubmitVote = async () => {
  if (!selectedMale || !selectedFemale) {
    setMessage('Anda harus memilih satu kandidat dari setiap kategori.');
    return;
  }
  setSubmitLoading(true);
  setMessage('');
  
  try {
    if (!authUser) throw new Error("Sesi login tidak ditemukan.");

    await runTransaction(db, async (transaction) => {
      // --- TAHAP 1: DEFINISIKAN SEMUA REFERENSI DOKUMEN ---
      const userDocRef = doc(db, 'users', authUser.uid);
      const maleCandidateRef = doc(db, 'candidates', selectedMale);
      const femaleCandidateRef = doc(db, 'candidates', selectedFemale);

      // --- TAHAP 2: BACA SEMUA DATA TERLEBIH DAHULU (READS) ---
      const userDoc = await transaction.get(userDocRef);
      const maleCandidateDoc = await transaction.get(maleCandidateRef);
      const femaleCandidateDoc = await transaction.get(femaleCandidateRef);

      // --- TAHAP 3: LAKUKAN VALIDASI ---
      if (!userDoc.exists()) {
        throw new Error("Data pengguna tidak ditemukan di database.");
      }
      if (userDoc.data().hasVoted) {
        throw new Error("Anda sudah pernah memberikan suara sebelumnya.");
      }
      if (!maleCandidateDoc.exists() || !femaleCandidateDoc.exists()) {
        throw new Error("Kandidat yang dipilih tidak valid.");
      }

      // --- TAHAP 4: TULIS SEMUA DATA (WRITES) ---
      const newMaleVoteCount = maleCandidateDoc.data().voteCount + 1;
      transaction.update(maleCandidateRef, { voteCount: newMaleVoteCount });

      const newFemaleVoteCount = femaleCandidateDoc.data().voteCount + 1;
      transaction.update(femaleCandidateRef, { voteCount: newFemaleVoteCount });

      transaction.update(userDocRef, { hasVoted: true });
    });

    // Jika transaksi berhasil, set status vote selesai
    setVoteCompleted(true);

  } catch (error) {
    console.error("Detail Error Vote:", error);
    setMessage(`Gagal: ${error.message}`);
  } finally {
    setSubmitLoading(false); 
  }
};

  // Tampilan loading awal
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Memeriksa status...</div>;
  }

  // Tampilan "Terima Kasih" jika user baru saja vote atau sudah pernah vote sebelumnya
  if (voteCompleted || (userProfile && userProfile.hasVoted)) {
    return (
        <main className="flex items-center justify-center min-h-screen text-center p-4">
            <div>
                <h1 className="text-3xl font-bold text-green-600">Terimakasih.</h1>
                <p className="mt-2 text-xl text-slate-700">Bangun Kemandirian, Raih Kesejahteraan</p>
            </div>
        </main>
    );
  }

  // Tampilan utama halaman vote
  return (
    <main className="container mx-auto p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">PEMILIHAN</h1>
        <p className="mt-2 text-gray-600">Pilih masing-masing 1 kandidat laki-laki dan perempuan.</p>
      </div>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Kategori Laki-laki</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {maleCandidates.map(candidate => (
            <div
              key={candidate.id}
              className={`p-4 border rounded-lg cursor-pointer text-center transition-colors ${selectedMale === candidate.id ? 'bg-blue-500 text-white' : 'bg-white hover:bg-blue-50'}`}
              onClick={() => setSelectedMale(candidate.id)}
            >
              <p className="font-bold text-lg">{candidate.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Kategori Perempuan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {femaleCandidates.map(candidate => (
            <div
              key={candidate.id}
              className={`p-4 border rounded-lg cursor-pointer text-center transition-colors ${selectedFemale === candidate.id ? 'bg-pink-500 text-white' : 'bg-white hover:bg-pink-50'}`}
              onClick={() => setSelectedFemale(candidate.id)}
            >
              <p className="font-bold text-lg">{candidate.name}</p>
            </div>
          ))}
        </div>
      </section>
      
      <footer className="text-center mt-8">
        {message && <p className="mb-4 font-semibold text-red-600">{message}</p>}
        <button
          onClick={handleSubmitVote}
          disabled={!selectedMale || !selectedFemale || submitLoading}
          className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg disabled:bg-gray-400 hover:bg-green-700 transition-colors"
        >
          {submitLoading ? 'Mengirim...' : 'KIRIM'}
        </button>
      </footer>
    </main>
  );
}