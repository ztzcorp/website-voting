'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- Impor untuk Grafik ---
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Daftarkan komponen chart
ChartJS.register(ArcElement, Tooltip, Legend);


// --- Komponen Modal untuk Menampilkan Daftar Pemilih ---
const VotersModal = ({ candidate, onClose }) => {
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVoters = async () => {
      if (!candidate) return;
      setLoading(true);
      try {
        const votersRef = collection(db, 'candidates', candidate.id, 'voters');
        const votersSnap = await getDocs(votersRef);
        setVoters(votersSnap.docs.map(doc => doc.data()));
      } catch (error) {
        console.error("Gagal mengambil data pemilih:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVoters();
  }, [candidate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-gray-800">
        <h3 className="text-xl font-bold mb-4">Pemilih untuk: {candidate.name}</h3>
        {loading ? (
          <p>Memuat data pemilih...</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {voters.length > 0 ? (
              voters.map((voter, index) => (
                <li key={index} className="bg-gray-100 p-2 rounded">
                  {voter.voterEmail}
                </li>
              ))
            ) : (
              <p>Belum ada suara untuk kandidat ini.</p>
            )}
          </ul>
        )}
        <button onClick={onClose} className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Tutup</button>
      </div>
    </div>
  );
};

// --- Komponen untuk Tampilan Akses Ditolak ---
const AccessDeniedPage = () => (
    <main className="flex flex-col justify-center items-center min-h-screen text-center p-4">
      <div className="bg-white p-10 rounded-xl shadow-lg max-w-lg">
        <h1 className="text-3xl font-bold text-red-600">Akses Ditolak</h1>
        <p className="mt-2 text-slate-600">Halaman laporan ini hanya dapat diakses oleh Admin.</p>
      </div>
    </main>
);

// --- Komponen untuk Grafik Pai ---
const PieChartCard = ({ data, title }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg">
    <h2 className="text-xl font-bold mb-4 text-center text-slate-800">{title}</h2>
    <div className="w-full max-w-xs mx-auto">
      <Pie data={data} />
    </div>
  </div>
);

// --- Komponen untuk Kartu Statistik ---
const StatsCard = ({ label, value, total }) => (
  <div className="bg-white p-6 text-center rounded-xl shadow-lg">
    <p className="text-4xl font-bold text-indigo-600">{value}</p>
    <p className="text-gray-500">{label} (dari {total} total)</p>
  </div>
);


// --- Komponen untuk Tampilan Laporan Admin ---
const AdminReport = () => {
  const [candidates, setCandidates] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      if (isMounted) setUsers(usersSnapshot.docs.map(doc => doc.data()));
    };

    const qCandidates = query(collection(db, 'candidates'), orderBy('voteCount', 'desc'));
    const unsubscribeCandidates = onSnapshot(qCandidates, (snapshot) => {
      if (isMounted) {
        setCandidates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsLoading(false);
      }
    });

    fetchUsers();

    return () => {
      isMounted = false;
      unsubscribeCandidates();
    };
  }, []);

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Voting');
    worksheet.columns = [
      { header: 'No.', key: 'no', width: 5 },
      { header: 'Nama Kandidat', key: 'name', width: 30 },
      { header: 'Kategori', key: 'gender', width: 15 },
      { header: 'Jabatan', key: 'position', width: 25 },
      { header: 'Jumlah Suara', key: 'voteCount', width: 15 },
    ];
    const dataToExport = candidates.map((candidate, index) => ({
      no: index + 1,
      name: candidate.name,
      gender: candidate.gender,
      position: candidate.position,
      voteCount: candidate.voteCount,
    }));
    worksheet.addRows(dataToExport);
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Laporan_Voting_${new Date().toLocaleDateString('id-ID')}.xlsx`);
  };

  const handleReset = async () => {
    if (window.confirm("YAKIN INGIN MERESET DATA? Aksi ini tidak bisa dibatalkan.")) {
      setResetLoading(true);
      try {
        const batch = writeBatch(db);
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => batch.update(doc.ref, { hasVoted: false }));
        const candidatesQuery = query(collection(db, 'candidates'));
        const candidatesSnapshot = await getDocs(candidatesQuery);
        candidatesSnapshot.forEach(doc => batch.update(doc.ref, { voteCount: 0 }));
        await batch.commit();
        alert("Sukses! Data telah berhasil di-reset.");
      } catch (error) {
        alert(`Error: ${error.message}`);
      } finally {
        setResetLoading(false);
      }
    }
  };

  if (isLoading) {
    return <p className="text-center mt-10 text-xl animate-pulse">Memuat data laporan...</p>;
  }

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0) / 2;
  const usersVoted = users.filter(u => u.hasVoted).length;
  const usersNotVoted = users.length - usersVoted;
  const maleCandidates = candidates.filter(c => c.gender === 'Laki-laki');
  const femaleCandidates = candidates.filter(c => c.gender === 'Perempuan');
  
  const userStatsData = {
    labels: ['Sudah Memilih', 'Belum Memilih'],
    datasets: [{
      data: [usersVoted, usersNotVoted],
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderColor: ['rgba(16, 185, 129, 1)', 'rgba(239, 68, 68, 1)'],
      borderWidth: 1,
    }],
  };
  const getPercentage = (count) => (totalVotes > 0 ? (count / totalVotes) * 100 : 0);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Dasbor Laporan Suara</h1>
          <p className="mt-2 text-lg text-slate-600">Total Suara Masuk: <span className="font-bold text-indigo-600">{Math.round(totalVotes)}</span></p>
      </div>

      <div className="text-center mb-10 flex flex-wrap justify-center items-center gap-4">
        <button onClick={handleExport} className="px-6 py-2 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700">Export ke Excel</button>
        <button onClick={() => router.push('/admin')} className="px-6 py-2 font-semibold text-white bg-purple-600 rounded-lg shadow-md hover:bg-purple-700">Buka Panel Admin</button>
      </div>

      {/* --- BAGIAN STATISTIK YANG DIPERBARUI --- */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
        <StatsCard label="Pengguna Sudah Vote" value={usersVoted} total={users.length} />
        <StatsCard label="Pengguna Belum Vote" value={usersNotVoted} total={users.length} />
        <div className="md:col-span-2 lg:col-span-1">
          <PieChartCard data={userStatsData} title="Partisipasi Pemilih" />
        </div>
      </section>
      
      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Kategori Laki-laki</h2>
          <div className="space-y-6">
            {maleCandidates.map((candidate) => (
              <div key={candidate.id} onClick={() => setSelectedCandidate(candidate)} className="cursor-pointer group">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-lg group-hover:text-blue-600">{candidate.name}</span>
                  <span className="text-lg font-bold text-indigo-600">{candidate.voteCount} Suara</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4"><div className="bg-blue-600 h-4 rounded-full" style={{ width: `${getPercentage(candidate.voteCount)}%` }}></div></div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Kategori Perempuan</h2>
          <div className="space-y-6">
            {femaleCandidates.map((candidate) => (
              <div key={candidate.id} onClick={() => setSelectedCandidate(candidate)} className="cursor-pointer group">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-lg group-hover:text-pink-600">{candidate.name}</span>
                  <span className="text-lg font-bold text-indigo-600">{candidate.voteCount} Suara</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4"><div className="bg-pink-500 h-4 rounded-full" style={{ width: `${getPercentage(candidate.voteCount)}%` }}></div></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="mt-12">
        <div className="bg-white max-w-lg mx-auto p-4 text-center border-2 border-red-500 rounded-xl shadow-lg">
            <h3 className="font-bold text-lg text-red-700">Zona Berbahaya</h3>
            <p className="text-sm text-slate-600 my-2">Tombol di bawah ini akan mereset semua data voting yang ada. Gunakan dengan hati-hati.</p>
            <button onClick={handleReset} disabled={resetLoading} className="w-full sm:w-auto mt-2 px-6 py-2 font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-800 disabled:bg-gray-400 disabled:cursor-not-allowed">
              {resetLoading ? 'Memproses...' : 'Reset Semua Data Voting'}
            </button>
        </div>
      </footer>
      {selectedCandidate && (<VotersModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />)}
    </main>
  );
};


// --- Komponen Utama Halaman Laporan ---
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
