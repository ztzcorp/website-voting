'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, doc, runTransaction, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// --- Komponen UI: Kartu Kandidat ---
const CandidateCard = ({ candidate, isSelected, onSelect }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 text-center flex flex-col items-center hover:shadow-lg transition-shadow duration-300">
      <div className="relative w-24 h-24 mb-4">
        <Image
          src={candidate.imageUrl || '/default-avatar.png'}
          alt={candidate.name}
          width={96}
          height={96}
          className="rounded-full object-cover border-2 border-gray-200"
        />
      </div>
      <div className="flex-grow">
        <h3 className="font-bold text-lg text-gray-800">{candidate.name}</h3>
        <p className="text-sm text-gray-500">{candidate.position}</p>
        {/* Tampilkan Tempat Tugas jika ada */}
        {candidate.workplace && <p className="text-xs text-gray-400 mt-1">{candidate.workplace}</p>}
        {/* Tampilkan Deskripsi jika ada */}
        {candidate.description && <p className="text-sm text-gray-600 my-2 italic">"{candidate.description}"</p>}
      </div>
      <button
        onClick={onSelect}
        className={`w-full mt-auto py-2 font-semibold rounded-lg transition-colors duration-300 ${isSelected ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
      >
        {isSelected ? '✓ Terpilih' : 'Pilih'}
      </button>
    </div>
  );
};

// --- Komponen UI: Tab Kategori ---
const CategoryTabs = ({ activeTab, setActiveTab, maleCount, femaleCount }) => {
  return (
    <div className="flex w-full max-w-lg mx-auto bg-gray-200 rounded-lg p-1 mb-8">
      <button
        onClick={() => setActiveTab('laki-laki')}
        className={`w-1/2 py-2.5 rounded-md font-semibold text-sm transition-all duration-300 ${activeTab === 'laki-laki' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}
      >
        Karyawan Laki-laki ({maleCount} orang)
      </button>
      <button
        onClick={() => setActiveTab('perempuan')}
        className={`w-1/2 py-2.5 rounded-md font-semibold text-sm transition-all duration-300 ${activeTab === 'perempuan' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}
      >
        Karyawan Perempuan ({femaleCount} orang)
      </button>
    </div>
  );
};

// --- Komponen UI: Countdown Timer ---
const CountdownTimer = ({ targetDate }) => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeft = {};
      if (difference > 0) {
        timeLeft = {
          Hari: Math.floor(difference / (1000 * 60 * 60 * 24)),
          Jam: Math.floor((difference / (1000 * 60 * 60)) % 24),
          Menit: Math.floor((difference / 1000 / 60) % 60),
          Detik: Math.floor((difference / 1000) % 60),
        };
      }
      return timeLeft;
    };
  
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  
    useEffect(() => {
      const timer = setTimeout(() => setTimeLeft(calculateTimeLeft()), 1000);
      return () => clearTimeout(timer);
    });
  
    const timerComponents = Object.keys(timeLeft).map((interval) => {
      if (!timeLeft[interval] && timeLeft[interval] !== 0) return null;
      return (
        <div key={interval} className="text-center bg-white p-3 rounded-lg shadow-sm">
          <span className="text-2xl md:text-4xl font-bold text-blue-600">{timeLeft[interval]}</span>
          <span className="block text-xs uppercase text-gray-500">{interval}</span>
        </div>
      );
    });
  
    return (
      <div className="flex justify-center space-x-2 md:space-x-4 my-6">
        {timerComponents.length ? timerComponents : <span className="text-xl font-bold text-red-500">Waktu Voting Telah Berakhir!</span>}
      </div>
    );
};

// --- Komponen UI: Modal Konfirmasi ---
const ConfirmationModal = ({ male, female, onConfirm, onCancel, isLoading }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
        <h3 className="text-xl font-bold mb-4">Konfirmasi Pilihan Anda</h3>
        <p className="mb-6 text-gray-600">Apakah Anda yakin dengan pilihan berikut?</p>
        <div className="space-y-4 mb-8 text-left">
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="font-semibold text-gray-800">Karyawan Laki-laki:</p>
            <p>{male?.name || 'Belum dipilih'}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="font-semibold text-gray-800">Karyawan Perempuan:</p>
            <p>{female?.name || 'Belum dipilih'}</p>
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <button onClick={onCancel} disabled={isLoading} className="px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400">Batal</button>
          <button onClick={onConfirm} disabled={isLoading} className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400">
            {isLoading ? 'Memproses...' : 'Ya, Yakin'}
          </button>
        </div>
      </div>
    </div>
);


// --- Komponen Utama Halaman Vote ---
export default function VotePage() {
  const [maleCandidates, setMaleCandidates] = useState([]);
  const [femaleCandidates, setFemaleCandidates] = useState([]);
  const [selectedMale, setSelectedMale] = useState(null);
  const [selectedFemale, setSelectedFemale] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [voteCompleted, setVoteCompleted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState('laki-laki');
  const [votingStatus, setVotingStatus] = useState({ isActive: false, message: 'Memuat status voting...' });
  const [endDate, setEndDate] = useState(null);

  const { authUser, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Efek untuk memeriksa periode voting
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'votingPeriod');
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.isEnabled === false) {
            setVotingStatus({ isActive: true, message: '' });
            setEndDate(null);
            return;
        }

        const { startDate, endDate } = data;
        if (startDate && endDate) {
            const now = new Date();
            const start = startDate.toDate();
            const end = endDate.toDate();
            setEndDate(end);

            if (now < start) {
              setVotingStatus({ isActive: false, message: `Voting akan dimulai pada ${start.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}` });
            } else if (now > end) {
              setVotingStatus({ isActive: false, message: 'Periode voting telah berakhir.' });
            } else {
              setVotingStatus({ isActive: true, message: '' });
            }
        } else {
            setVotingStatus({ isActive: false, message: 'Periode voting belum diatur oleh admin.' });
        }
      } else {
        setVotingStatus({ isActive: true, message: '' }); // Jika dokumen setting tidak ada, anggap voting terbuka
      }
    });
    return () => unsubscribe();
  }, []);

  // Efek untuk otentikasi
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) router.push('/login');
    if (userProfile && userProfile.hasVoted) setVoteCompleted(true);
  }, [authUser, userProfile, authLoading, router]);

  // Efek untuk mengambil data kandidat
  useEffect(() => {
    const fetchCandidates = async () => {
      const querySnapshot = await getDocs(collection(db, 'candidates'));
      const candidatesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaleCandidates(candidatesData.filter(c => c.gender === 'Laki-laki'));
      setFemaleCandidates(candidatesData.filter(c => c.gender === 'Perempuan'));
    };
    fetchCandidates();
  }, []);

  // Handler untuk menampilkan modal konfirmasi
  const handleShowConfirmation = () => {
    if (!selectedMale || !selectedFemale) {
      setMessage('Anda harus memilih satu kandidat dari setiap kategori.');
      return;
    }
    setMessage('');
    setShowConfirmation(true);
  };

  // Handler untuk mengirim vote setelah konfirmasi
  const handleConfirmVote = async () => {
    setSubmitLoading(true);
    try {
      if (!authUser) throw new Error("Sesi login tidak ditemukan.");
      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, 'users', authUser.uid);
        const maleCandidateRef = doc(db, 'candidates', selectedMale);
        const femaleCandidateRef = doc(db, 'candidates', selectedFemale);
        const maleVoteRecordRef = doc(collection(maleCandidateRef, 'voters'), authUser.uid);
        const femaleVoteRecordRef = doc(collection(femaleCandidateRef, 'voters'), authUser.uid);
        
        const userDoc = await transaction.get(userDocRef);
        const maleCandidateDoc = await transaction.get(maleCandidateRef);
        const femaleCandidateDoc = await transaction.get(femaleCandidateRef);
        
        if (!userDoc.exists()) throw new Error("Data pengguna tidak ditemukan.");
        if (userDoc.data().hasVoted) throw new Error("Anda sudah pernah memberikan suara.");
        if (!maleCandidateDoc.exists() || !femaleCandidateDoc.exists()) throw new Error("Kandidat tidak valid.");
        
        transaction.update(maleCandidateRef, { voteCount: maleCandidateDoc.data().voteCount + 1 });
        transaction.update(femaleCandidateRef, { voteCount: femaleCandidateDoc.data().voteCount + 1 });
        transaction.update(userDocRef, { hasVoted: true });
        transaction.set(maleVoteRecordRef, { voterEmail: userProfile.email, votedAt: new Date() });
        transaction.set(femaleVoteRecordRef, { voterEmail: userProfile.email, votedAt: new Date() });
      });
      setVoteCompleted(true);
    } catch (error) {
      setMessage(`Gagal: ${error.message}`);
    } finally {
      setSubmitLoading(false);
      setShowConfirmation(false);
    }
  };

  // Filter kandidat berdasarkan pencarian
  const filteredMaleCandidates = maleCandidates.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFemaleCandidates = femaleCandidates.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Tampilan Loading Awal
  if (authLoading || votingStatus.message === 'Memuat status voting...') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Tampilan Jika User Sudah Vote
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
  
  // Tampilan Jika Voting Ditutup
  if (!votingStatus.isActive) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-white p-10 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-red-500">Voting Ditutup</h1>
          <p className="mt-4 text-xl">{votingStatus.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800">Voting Karyawan Favorit</h1>
          {endDate && <p className="text-lg text-gray-500 mt-2">Periode Voting Akan Berakhir Dalam:</p>}
        </div>

        {endDate && <CountdownTimer targetDate={endDate} />}

        <div className="my-8 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Cari nama kandidat di sini..."
            className="w-full px-5 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <CategoryTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          maleCount={maleCandidates.length}
          femaleCount={femaleCandidates.length}
        />

        <div className="mt-6">
          {activeTab === 'laki-laki' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMaleCandidates.map(candidate => (
                <CandidateCard key={candidate.id} candidate={candidate} isSelected={selectedMale === candidate.id} onSelect={() => setSelectedMale(candidate.id)} />
              ))}
            </div>
          )}
          {activeTab === 'perempuan' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredFemaleCandidates.map(candidate => (
                <CandidateCard key={candidate.id} candidate={candidate} isSelected={selectedFemale === candidate.id} onSelect={() => setSelectedFemale(candidate.id)} />
              ))}
            </div>
          )}
        </div>
        
        <footer className="text-center mt-12">
          {message && <p className="mb-4 font-semibold text-red-600">{message}</p>}
          <button
            onClick={handleShowConfirmation}
            disabled={!selectedMale || !selectedFemale}
            className="px-12 py-4 bg-green-600 text-white font-bold text-lg rounded-lg disabled:bg-gray-400 hover:bg-green-700 transition-colors shadow-lg"
          >
            SUBMIT VOTE
          </button>
        </footer>

        {showConfirmation && (
          <ConfirmationModal
            male={maleCandidates.find(c => c.id === selectedMale)}
            female={femaleCandidates.find(c => c.id === selectedFemale)}
            onConfirm={handleConfirmVote}
            onCancel={() => setShowConfirmation(false)}
            isLoading={submitLoading}
          />
        )}
      </div>
    </main>
  );
}
