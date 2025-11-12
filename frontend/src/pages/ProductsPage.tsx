import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { Plus, Edit, Trash2, Upload, Download } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand?: string;
  hargaModal: number;
  hargaJual: number;
  hargaReseller: number;
  stock: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    hargaModal: 0,
    hargaJual: 0,
    hargaReseller: 0,
    stock: 0,
  });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        alert('Produk berhasil diupdate!');
      } else {
        await api.post('/products', formData);
        alert('Produk berhasil ditambahkan!');
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        brand: '',
        hargaModal: 0,
        hargaJual: 0,
        hargaReseller: 0,
        stock: 0,
      });
      fetchProducts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menyimpan produk');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand || '',
      hargaModal: product.hargaModal,
      hargaJual: product.hargaJual,
      hargaReseller: product.hargaReseller,
      stock: product.stock,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      await api.delete(`/products/${id}`);
      alert('Produk berhasil dihapus!');
      fetchProducts();
    } catch (error) {
      alert('Gagal menghapus produk');
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('File harus berformat .csv');
      return;
    }

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        const dataLines = lines.slice(1);
        
        let successCount = 0;
        let errorCount = 0;

        for (const line of dataLines) {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          
          if (values.length < 6) continue;

          const [name, brand, hargaModal, hargaJual, hargaReseller, stock] = values;

          try {
            await api.post('/products', {
              name,
              brand: brand || undefined,
              hargaModal: parseFloat(hargaModal),
              hargaJual: parseFloat(hargaJual),
              hargaReseller: parseFloat(hargaReseller),
              stock: parseInt(stock),
            });
            successCount++;
          } catch (error) {
            console.error(`Failed to import: ${name}`, error);
            errorCount++;
          }
        }

        alert(`Import selesai!\nBerhasil: ${successCount}\nGagal: ${errorCount}`);
        fetchProducts();
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Gagal membaca file CSV');
      } finally {
        setImporting(false);
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      alert('Gagal membaca file');
      setImporting(false);
    };

    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const sampleData = `name,brand,hargaModal,hargaJual,hargaReseller,stock
Produk Contoh 1,Brand A,10000,15000,12000,50
Produk Contoh 2,Brand B,20000,30000,25000,30
Produk Contoh 3,,15000,22000,18000,100`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-produk.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-textPrimary">Produk</h1>
        <div className="flex gap-3">
          <button
            onClick={downloadSampleCSV}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Download className="w-5 h-5" />
            Sample CSV
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            Tambah Produk
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportCSV}
        className="hidden"
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Produk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga Modal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga Jual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga Reseller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-textPrimary">
                    {product.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {product.brand || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Rp {product.hargaModal.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">
                  Rp {product.hargaJual.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  Rp {product.hargaReseller.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.stock > 10
                        ? 'bg-green-100 text-green-800'
                        : product.stock > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-primary hover:text-blue-700 mr-3"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-textPrimary">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Harga Modal
                  </label>
                  <input
                    type="number"
                    value={formData.hargaModal}
                    onChange={(e) =>
                      setFormData({ ...formData, hargaModal: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Harga Jual
                  </label>
                  <input
                    type="number"
                    value={formData.hargaJual}
                    onChange={(e) =>
                      setFormData({ ...formData, hargaJual: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Harga Reseller
                  </label>
                  <input
                    type="number"
                    value={formData.hargaReseller}
                    onChange={(e) =>
                      setFormData({ ...formData, hargaReseller: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Stok
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    setFormData({
                      name: '',
                      brand: '',
                      hargaModal: 0,
                      hargaJual: 0,
                      hargaReseller: 0,
                      stock: 0,
                    });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-textPrimary font-semibold py-2 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}