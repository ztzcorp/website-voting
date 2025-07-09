// app/vote/page.js
'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, doc, runTransaction, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function VotePage() {
  const [maleCandidates, setMaleCandidates] = useState([]);
  const [femaleCandidates, setFemaleCandidates] = useState([]);
  const [selectedMale, setSelectedMale] = useState(null);
  const [selectedFemale, setSelectedFemale] = useState(null);
  const [user, setUser] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Cek status login dan status vote user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().hasVoted) {
          setHasVoted(true);
        }
        setLoading(false);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

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

  const handleSubmitVote = async () => {
    if (!selectedMale || !selectedFemale) {
      alert('Anda harus memilih 1 kandidat laki-laki dan 1 kandidat perempuan.');
      return;
    }
    if (!user || hasVoted) {
        alert('Anda sudah melakukan voting atau tidak memiliki akses.');
        return;
    }

    try {
      // KODE YANG SUDAH DIPERBAIKI
await runTransaction(db, async (transaction) => {
    // 1. Define all document references
    const userDocRef = doc(db, 'users', user.uid);
    const maleCandidateRef = doc(db, 'candidates', selectedMale);
    const femaleCandidateRef = doc(db, 'candidates', selectedFemale);

    // --- READ PHASE ---
    // 2. Execute all reads first
    const userDoc = await transaction.get(userDocRef);
    const maleCandidateDoc = await transaction.get(maleCandidateRef);
    const femaleCandidateDoc = await transaction.get(femaleCandidateRef);

    // 3. Perform validation using the data you just read
    if (userDoc.exists() && userDoc.data().hasVoted) {
        throw new Error("User sudah melakukan vote!");
    }
    if (!maleCandidateDoc.exists() || !femaleCandidateDoc.exists()) {
        throw new Error("Kandidat tidak ditemukan.");
    }

    // --- WRITE PHASE ---
    // 4. After all reads are complete, perform all writes
    const newMaleVoteCount = maleCandidateDoc.data().voteCount + 1;
    transaction.update(maleCandidateRef, { voteCount: newMaleVoteCount });

    const newFemaleVoteCount = femaleCandidateDoc.data().voteCount + 1;
    transaction.update(femaleCandidateRef, { voteCount: newFemaleVoteCount });

    transaction.update(userDocRef, { hasVoted: true });
});

      alert('Terima kasih! Suara Anda telah berhasil direkam.');
      setHasVoted(true); // Update state di UI
      router.push('/laporan'); // Arahkan ke laporan
    } catch (error) {
      console.error("Error submitting vote: ", error);
      alert('Terjadi kesalahan saat menyimpan suara Anda.');
    }
  };

  if (loading) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  if (hasVoted) {
    return (
        <div className="text-center mt-20">
            <h1 className="text-2xl font-bold">Terima Kasih!</h1>
            <p>Anda sudah melakukan voting.</p>
            <button onClick={() => router.push('/laporan')} className="mt-4 px-4 py-2 bg-green-500 text-white rounded">Lihat Hasil</button>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Pilih Manusia Terfavorit Anda</h1>

      {/* Kandidat Laki-laki */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Kategori Laki-laki</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {maleCandidates.map(candidate => (
            <div key={candidate.id}
                 className={`p-4 border rounded-lg cursor-pointer text-center ${selectedMale === candidate.id ? 'bg-blue-500 text-white ring-2 ring-blue-700' : 'bg-white'}`}
                 onClick={() => setSelectedMale(candidate.id)}>
              <h3 className="font-bold text-lg">{candidate.name}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Kandidat Perempuan */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Kategori Perempuan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {femaleCandidates.map(candidate => (
            <div key={candidate.id}
                 className={`p-4 border rounded-lg cursor-pointer text-center ${selectedFemale === candidate.id ? 'bg-pink-500 text-white ring-2 ring-pink-700' : 'bg-white'}`}
                 onClick={() => setSelectedFemale(candidate.id)}>
              <h3 className="font-bold text-lg">{candidate.name}</h3>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleSubmitVote}
          disabled={!selectedMale || !selectedFemale}
          className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg disabled:bg-gray-400 hover:bg-green-700 transition-colors">
          SUBMIT VOTE
        </button>
      </div>
    </div>
  );
}