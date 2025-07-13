'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

// --- Komponen Modal untuk Form Tambah/Edit Kandidat ---
const CandidateModal = ({ isOpen, onClose, onSave, candidate, isLoading }) => {
  const [formData, setFormData] = useState({ name: '', gender: 'Laki-laki', position: '', imageUrl: '' });

  useEffect(() => {
    const defaultData = { name: '', gender: 'Laki-laki', position: '', imageUrl: '' };
    if (isOpen) {
      if (candidate) {
        setFormData({ ...defaultData, ...candidate });
      } else {
        setFormData(defaultData);
      }
    }
  }, [candidate, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg text-gray-800 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6">{candidate ? 'Edit Kandidat' : 'Tambah Kandidat Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block font-semibold mb-1">Nama Lengkap</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" required />
          </div>
          <div>
            <label htmlFor="position" className="block font-semibold mb-1">Jabatan</label>
            <input type="text" name="position" id="position" value={formData.position} onChange={handleChange} className="w-full p-2 border rounded-md" required />
          </div>
          <div>
            <label htmlFor="imageUrl" className="block font-semibold mb-1">URL Foto</label>
            <input type="text" name="imageUrl" id="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="https://..."/>
          </div>
          <div>
            <label htmlFor="gender" className="block font-semibold mb-1">Gender</label>
            <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border rounded-md">
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row-reverse gap-3">
             <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                {isLoading ? 'Menyimpan...' : 'Simpan'}
             </button>
             <button type="button" onClick={onClose} disabled={isLoading} className="w-full bg-gray-200 py-2.5 rounded-lg hover:bg-gray-300">
                Batal
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Komponen Modal untuk Form Tambah Pengguna ---
const UserModal = ({ isOpen, onClose, onSave, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ email, password });
    setEmail('');
    setPassword('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg text-gray-800 animate-fade-in">
        <h2 className="text-2xl font-bold mb-6">Tambah Pengguna Baru</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="user-email" className="block font-semibold mb-1">Email Pengguna</label>
            <input type="email" id="user-email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded-md" required />
          </div>
          <div>
            <label htmlFor="user-password" className="block font-semibold mb-1">Password Awal</label>
            <input type="password" id="user-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded-md" required minLength={6} />
            <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter. Beritahukan password ini kepada pengguna.</p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row-reverse gap-3">
             <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                {isLoading ? 'Menyimpan...' : 'Simpan Pengguna'}
             </button>
             <button type="button" onClick={onClose} disabled={isLoading} className="w-full bg-gray-200 py-2.5 rounded-lg hover:bg-gray-300">
                Batal
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Komponen Modal untuk Form EDIT Pengguna ---
const EditUserModal = ({ isOpen, onClose, onSave, user, isLoading }) => {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'user', hasVoted: false });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        password: '', // Password dikosongkan demi keamanan, diisi jika ingin diubah
        role: user.role || 'user',
        hasVoted: user.hasVoted || false,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user.id, formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg text-gray-800 animate-fade-in">
        <h2 className="text-2xl font-bold mb-2">Edit Pengguna</h2>
        <p className="mb-6 text-gray-600">{user?.email}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-email" className="block font-semibold mb-1">Email</label>
            <input type="email" name="email" id="edit-email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md" required />
          </div>
          <div>
            <label htmlFor="edit-password" className="block font-semibold mb-1">Password Baru (Opsional)</label>
            <input type="password" name="password" id="edit-password" value={formData.password} onChange={handleChange} className="w-full p-2 border rounded-md" minLength={6} placeholder="Kosongkan jika tidak ingin diubah"/>
          </div>
          <div>
            <label htmlFor="edit-role" className="block font-semibold mb-1">Role Pengguna</label>
            <select name="role" id="edit-role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded-md">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <input 
              type="checkbox"
              id="edit-hasVoted"
              name="hasVoted"
              checked={formData.hasVoted}
              onChange={handleChange}
              className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="edit-hasVoted" className="font-semibold cursor-pointer">Sudah Melakukan Voting</label>
          </div>
          <p className="text-xs text-gray-500 -mt-2">Hilangkan centang untuk mereset status vote pengguna ini.</p>
          <div className="pt-4 flex flex-col sm:flex-row-reverse gap-3">
             <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
             </button>
             <button type="button" onClick={onClose} disabled={isLoading} className="w-full bg-gray-200 py-2.5 rounded-lg hover:bg-gray-300">
                Batal
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Komponen Panel Admin Utama ---
export default function AdminPanel() {
  const { userProfile, authUser, loading: authLoading } = useAuth();
  
  const [candidates, setCandidates] = useState([]);
  const [users, setUsers] = useState([]);

  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [candidateFormLoading, setCandidateFormLoading] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormLoading, setUserFormLoading] = useState(false);

  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserFormLoading, setEditUserFormLoading] = useState(false);
  
  const [votingSettings, setVotingSettings] = useState({ startDate: '', endDate: '', isEnabled: true });

  useEffect(() => {
    const unsubCandidates = onSnapshot(collection(db, 'candidates'), (snapshot) => {
      setCandidates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'votingPeriod'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setVotingSettings({
          startDate: data.startDate ? new Date(data.startDate.seconds * 1000).toISOString().slice(0, 16) : '',
          endDate: data.endDate ? new Date(data.endDate.seconds * 1000).toISOString().slice(0, 16) : '',
          isEnabled: data.isEnabled === undefined ? true : data.isEnabled,
        });
      }
    });

    return () => {
      unsubCandidates();
      unsubUsers();
      unsubSettings();
    };
  }, []);

  const handleSaveCandidate = async (candidateData) => {
    setCandidateFormLoading(true);
    try {
      if (editingCandidate) {
        const docRef = doc(db, 'candidates', editingCandidate.id);
        const { id, ...dataToUpdate } = candidateData;
        await updateDoc(docRef, dataToUpdate);
      } else {
        await addDoc(collection(db, 'candidates'), { ...candidateData, voteCount: 0 });
      }
    } catch (error) {
      console.error("Error saving candidate:", error);
      alert("Gagal menyimpan data kandidat.");
    } finally {
      setCandidateFormLoading(false);
      setIsCandidateModalOpen(false);
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (window.confirm("Yakin ingin menghapus kandidat ini?")) {
      await deleteDoc(doc(db, 'candidates', id));
    }
  };

  const handleSaveUser = async ({ email, password }) => {
    setUserFormLoading(true);
    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert(`Sukses: ${data.message}`);
      setIsUserModalOpen(false);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setUserFormLoading(false);
    }
  };
  
  const handleUpdateUser = async (userId, formData) => {
    setEditUserFormLoading(true);
    const { email, password, role, hasVoted } = formData;
    try {
      // 1. Update data di Firestore (role, hasVoted)
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { role, hasVoted });

      // 2. Jika ada perubahan email atau password, panggil API
      const authDataChanged = email !== editingUser.email || password;
      if (authDataChanged) {
        const response = await fetch('/api/update-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: userId,
            email: email,
            password: password || null, // Kirim null jika password kosong
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
      }
      alert("Data pengguna berhasil diperbarui.");
    } catch (error) {
      alert(`Gagal memperbarui pengguna: ${error.message}`);
    } finally {
      setEditUserFormLoading(false);
      setIsEditUserModalOpen(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("PERINGATAN: Aksi ini akan menghapus pengguna secara permanen. Yakin?")) {
      try {
        const response = await fetch('/api/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: userId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        alert(data.message);
      } catch (error) {
        alert(`Gagal menghapus pengguna: ${error.message}`);
      }
    }
  };
  
  const handleSavePeriod = async () => {
    if (votingSettings.isEnabled && (!votingSettings.startDate || !votingSettings.endDate)) {
      alert("Jika periode voting diaktifkan, harap isi tanggal mulai dan berakhir.");
      return;
    }
    const settingsRef = doc(db, 'settings', 'votingPeriod');
    try {
      await updateDoc(settingsRef, {
        startDate: votingSettings.isEnabled ? new Date(votingSettings.startDate) : null,
        endDate: votingSettings.isEnabled ? new Date(votingSettings.endDate) : null,
        isEnabled: votingSettings.isEnabled,
      });
      alert("Pengaturan periode voting berhasil diperbarui.");
    } catch(error) {
      alert("Gagal menyimpan periode.");
    }
  };

  const handleTogglePeriod = async (e) => {
    const newIsEnabled = e.target.checked;
    setVotingSettings(prev => ({ ...prev, isEnabled: newIsEnabled }));
    const settingsRef = doc(db, 'settings', 'votingPeriod');
    try {
      await updateDoc(settingsRef, { isEnabled: newIsEnabled });
    } catch (error) {
      alert("Gagal menyimpan status periode. Coba lagi.");
      setVotingSettings(prev => ({ ...prev, isEnabled: !newIsEnabled }));
    }
  };

  const handleOpenAddCandidateModal = () => {
    setEditingCandidate(null);
    setIsCandidateModalOpen(true);
  };
  const handleOpenEditCandidateModal = (candidate) => {
    setEditingCandidate(candidate);
    setIsCandidateModalOpen(true);
  };
  const handleOpenEditUserModal = (user) => {
    setEditingUser(user);
    setIsEditUserModalOpen(true);
  };

  if (authLoading) return <p className="text-center mt-10">Loading...</p>;
  if (!userProfile || userProfile.role !== 'admin') return <p className="text-center mt-10">Akses ditolak.</p>;

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-800">Panel Admin</h1>

      <section className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Pengaturan Periode Voting</h2>
        <div className="flex items-center space-x-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
           <input type="checkbox" id="enablePeriod" className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" checked={votingSettings.isEnabled} onChange={handleTogglePeriod}/>
           <label htmlFor="enablePeriod" className="font-semibold text-gray-700 cursor-pointer">Aktifkan Periode Voting Terjadwal</label>
        </div>
        <div className={`grid md:grid-cols-3 gap-4 items-end transition-opacity duration-300 ${votingSettings.isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div>
            <label className="block font-semibold text-gray-700">Waktu Mulai</label>
            <input type="datetime-local" value={votingSettings.startDate} onChange={e => setVotingSettings({...votingSettings, startDate: e.target.value})} disabled={!votingSettings.isEnabled} className="mt-1 w-full p-2 border rounded-md disabled:bg-gray-200" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700">Waktu Berakhir</label>
            <input type="datetime-local" value={votingSettings.endDate} onChange={e => setVotingSettings({...votingSettings, endDate: e.target.value})} disabled={!votingSettings.isEnabled} className="mt-1 w-full p-2 border rounded-md disabled:bg-gray-200" />
          </div>
          <button onClick={handleSavePeriod} disabled={!votingSettings.isEnabled} className="bg-green-600 text-white py-2.5 px-4 rounded-lg h-fit hover:bg-green-700 disabled:bg-gray-400">Simpan Tanggal</button>
        </div>
        {!votingSettings.isEnabled && <p className="text-sm text-blue-700 mt-3">Periode voting tidak aktif. Voting akan selalu terbuka.</p>}
      </section>

      <section className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-3 sm:mb-0">Manajemen Pengguna</h2>
          <button onClick={() => setIsUserModalOpen(true)} className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700">+ Tambah Pengguna Baru</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-800">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status Vote</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-semibold">{user.email}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{user.role || 'user'}</span></td>
                  <td className="p-3">{user.hasVoted ? 'Ya' : 'Belum'}</td>
                  <td className="p-3 space-x-4 text-right whitespace-nowrap">
                    {authUser?.uid !== user.id ? (
                      <>
                        <button onClick={() => handleOpenEditUserModal(user)} className="font-semibold text-yellow-600 hover:text-yellow-800">Edit</button>
                        <button onClick={() => handleDeleteUser(user.id)} className="font-semibold text-red-600 hover:text-red-800">Hapus</button>
                      </>
                    ) : (<span className="text-sm text-gray-500">Ini Anda</span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-3 sm:mb-0">Manajemen Kandidat</h2>
          <button onClick={handleOpenAddCandidateModal} className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">+ Tambah Kandidat Baru</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-800">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Nama</th>
                <th className="p-3 hidden sm:table-cell">Jabatan</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map(candidate => (
                <tr key={candidate.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-semibold">{candidate.name}</td>
                  <td className="p-3 hidden sm:table-cell">{candidate.position}</td>
                  <td className="p-3 space-x-4 text-right">
                    <button onClick={() => handleOpenEditCandidateModal(candidate)} className="font-semibold text-yellow-600 hover:text-yellow-800">Edit</button>
                    <button onClick={() => handleDeleteCandidate(candidate.id)} className="font-semibold text-red-600 hover:text-red-800">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CandidateModal isOpen={isCandidateModalOpen} onClose={() => setIsCandidateModalOpen(false)} onSave={handleSaveCandidate} candidate={editingCandidate} isLoading={candidateFormLoading} />
      <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} isLoading={userFormLoading} />
      <EditUserModal isOpen={isEditUserModalOpen} onClose={() => setIsEditUserModalOpen(false)} onSave={handleUpdateUser} user={editingUser} isLoading={editUserFormLoading} />
    </div>
  );
}