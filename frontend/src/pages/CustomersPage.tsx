import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Plus, Trash2, User } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  _count?: {
    transactions: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', form);
      setForm({ name: '', phone: '' });
      fetchCustomers();
      alert('Pelanggan berhasil ditambahkan!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menambahkan pelanggan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pelanggan ini?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
      alert('Pelanggan berhasil dihapus.');
    } catch (error) {
      console.error('Failed to delete customer', error);
      alert('Gagal menghapus pelanggan.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Manajemen Pelanggan</h1>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-textPrimary mb-3">Tambah Pelanggan Baru</h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Nama Pelanggan"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full sm:w-auto flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
          />
          <input
            type="tel"
            placeholder="No. WhatsApp"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            className="w-full sm:w-auto flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
          />
          <button type="submit" className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition">
            <Plus className="w-5 h-5" />
            <span>Tambah</span>
          </button>
        </form>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-textPrimary">{c.name}</h3>
                <p className="text-sm text-gray-600">{c.phone}</p>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-red-500 hover:bg-red-100 rounded-full p-2 transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-grow" />
            <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100">
              <div>
                <span className="text-gray-600">Poin:</span>
                <span className="font-semibold ml-1 text-yellow-600">{c.points}</span>
              </div>
              <div>
                <span className="text-gray-600">Transaksi:</span>
                <span className="font-semibold ml-1">{c._count?.transactions || 0}</span>
              </div>
            </div>
            <button
              onClick={() => window.location.href = `/customers/${c.id}`}
              className="mt-3 w-full bg-gray-100 text-textPrimary px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition font-semibold flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              Lihat Profil
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}