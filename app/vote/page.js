// app/vote/page.js
'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, doc, runTransaction } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function VotePage() {
  const [maleCandidates, setMaleCandidates] = useState([]);
  const [femaleCandidates, setFemaleCandidates] = useState([]);
  
  const [selectedMale, setSelectedMale] = useState(null);
  const [selectedFemale, setSelectedFemale] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  
  const [message, setMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [voteCompleted, setVoteCompleted] = useState(false);
  
  const { authUser, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
    }
    if (userProfile && userProfile.hasVoted) {
      setVoteCompleted(true);
    }
  }, [authUser, userProfile, authLoading, router]);

  useEffect(() => {
    const fetchCandidates = async () => {
      const querySnapshot = await getDocs(collection(db, 'candidates'));
      const candidatesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaleCandidates(candidatesData.filter(c => c.gender === 'Laki-laki'));
      setFemaleCandidates(candidatesData.filter(c => c.gender === 'Perempuan'));
    };
    fetchCandidates();
  }, []);

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
        const userDocRef = doc(db, 'users', authUser.uid);
        const maleCandidateRef = doc(db, 'candidates', selectedMale);
        const femaleCandidateRef = doc(db, 'candidates', selectedFemale);

        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) throw new Error("Data pengguna tidak ditemukan.");
        if (userDoc.data().hasVoted) throw new Error("Anda sudah pernah memberikan suara.");
        
        const maleCandidateDoc = await transaction.get(maleCandidateRef);
        const femaleCandidateDoc = await transaction.get(femaleCandidateRef);
        if (!maleCandidateDoc.exists() || !femaleCandidateDoc.exists()) throw new Error("Kandidat tidak valid.");

        transaction.update(maleCandidateRef, { voteCount: maleCandidateDoc.data().voteCount + 1 });
        transaction.update(femaleCandidateRef, { voteCount: femaleCandidateDoc.data().voteCount + 1 });
        transaction.update(userDocRef, { hasVoted: true });
      });

      setVoteCompleted(true);

    } catch (error) {
      console.error("Detail Error Vote:", error);
      setMessage(`Gagal: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredMaleCandidates = maleCandidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFemaleCandidates = femaleCandidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Memeriksa status...</div>;
  }

  if (voteCompleted) {
    return (
        <main className="flex items-center justify-center min-h-screen text-center p-4">
            <div>
                <h1 className="text-3xl font-bold text-green-600">Terimakasih.</h1>
                <p className="mt-2 text-xl text-slate-700">Suara Anda telah di Rekam.</p>
            </div>
        </main>
    );
  }

  return (
    <main className="container mx-auto p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">PILIH KANDIDAT ANDA</h1>
        <p className="mt-2 text-gray-600">Pilih masing-masing 1 kandidat laki-laki dan perempuan.</p>
      </div>

      <div className="mb-10 max-w-xl mx-auto">
        <input
          type="text"
          placeholder="Anda bisa cari nama kandidat di sini..."
          className="w-full px-5 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Kategori Laki-laki</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredMaleCandidates.map(candidate => (
            <div
              key={candidate.id}
              className={`p-4 border rounded-lg cursor-pointer text-center transition-colors ${selectedMale === candidate.id ? 'bg-blue-500 text-white' : 'bg-white hover:bg-blue-50'}`}
              onClick={() => setSelectedMale(candidate.id)}
            >
              <p className="font-bold text-lg">{candidate.name}</p>
            </div>
          ))}
        </div>
        {filteredMaleCandidates.length === 0 && searchQuery && (
          <p className="text-center text-gray-500 mt-4">Kandidat Laki-laki dengan nama "{searchQuery}" tidak ditemukan.</p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Kategori Perempuan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredFemaleCandidates.map(candidate => (
            <div
              key={candidate.id}
              className={`p-4 border rounded-lg cursor-pointer text-center transition-colors ${selectedFemale === candidate.id ? 'bg-pink-500 text-white' : 'bg-white hover:bg-pink-50'}`}
              onClick={() => setSelectedFemale(candidate.id)}
            >
              <p className="font-bold text-lg">{candidate.name}</p>
            </div>
          ))}
        </div>
        {filteredFemaleCandidates.length === 0 && searchQuery && (
          <p className="text-center text-gray-500 mt-4">Kandidat Perempuan dengan nama "{searchQuery}" tidak ditemukan.</p>
        )}
      </section>
      
      {/* TOMBOL SUBMIT DIKEMBALIKAN DI SINI */}
      <footer className="text-center mt-8">
        {message && <p className="mb-4 font-semibold text-red-600">{message}</p>}
        <button
          onClick={handleSubmitVote}
          disabled={!selectedMale || !selectedFemale || submitLoading}
          className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg disabled:bg-gray-400 hover:bg-green-700 transition-colors"
        >
          {submitLoading ? 'Mengirim...' : 'K I R I M'}
        </button>
      </footer>
    </main>
  );
}