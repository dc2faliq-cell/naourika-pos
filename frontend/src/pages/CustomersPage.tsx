import { useState, useEffect } from 'react';
import api from '../lib/api';

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
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Management</h1>
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
          className="border border-gray-300 rounded px-3 py-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Customer
        </button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{c.name}</h3>
                <p className="text-sm text-gray-600">{c.phone}</p>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
              >
                Delete
              </button>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="text-gray-600">Points:</span>
                <span className="font-semibold ml-1">{c.points}</span>
              </div>
              <div>
                <span className="text-gray-600">Transactions:</span>
                <span className="font-semibold ml-1">{c._count?.transactions || 0}</span>
              </div>
            </div>
            <button
              onClick={() => window.location.href = `/customers/${c.id}`}
              className="mt-3 w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              View Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}