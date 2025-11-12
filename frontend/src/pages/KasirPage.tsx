import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

interface Product {
  id: string;
  name: string;
  brand?: string;
  hargaModal: number;
  hargaJual: number;
  hargaReseller: number;
  stock: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [useWholesalePrice, setUseWholesalePrice] = useState(false);
  const [additionalFee, setAdditionalFee] = useState(0);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Stok tidak cukup!');
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            if (newQuantity > item.stock) {
              alert('Stok tidak cukup!');
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const calculateTotal = () => {
    const price = useWholesalePrice ? 'hargaReseller' : 'hargaJual';
    const subtotal = cart.reduce((sum, item) => sum + (item as any)[price] * item.quantity, 0);
    const afterAdditional = subtotal + additionalFee;
    const finalTotal = afterAdditional - discount;
    return Math.max(0, finalTotal);
  };

  const calculateSubtotal = () => {
    const price = useWholesalePrice ? 'hargaReseller' : 'hargaJual';
    return cart.reduce((sum, item) => sum + (item as any)[price] * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Keranjang kosong!');
      return;
    }

    setLoading(true);

    try {
      const items = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      let customerId = selectedCustomerId;

      // If "new customer" form is shown, create customer first
      if (showNewCustomerForm && newCustomerName && newCustomerPhone) {
        try {
          const newCustomer = await api.post('/customers', {
            name: newCustomerName,
            phone: newCustomerPhone,
          });
          customerId = newCustomer.data.id;
          fetchCustomers(); // Refresh customer list
        } catch (error: any) {
          // If customer already exists (phone duplicate), try to find by phone
          if (error.response?.data?.error?.includes('already exists')) {
            const existingCustomer = customers.find(c => c.phone === newCustomerPhone);
            if (existingCustomer) {
              customerId = existingCustomer.id;
            }
          }
        }
      }

      // Get customer data for receipt
      const selectedCustomer = customers.find(c => c.id === customerId);

      const response = await api.post('/transactions', {
        items,
        paymentMethod,
        customerId: customerId || undefined,
        customerName: selectedCustomer?.name || newCustomerName || undefined,
        customerPhone: selectedCustomer?.phone || newCustomerPhone || undefined,
      });

      // Add additional data to transaction for receipt
      const transactionWithExtras = {
        ...response.data,
        additionalFee,
        discount,
        useWholesalePrice,
      };

      setLastTransaction(transactionWithExtras);
      
      // Reset form
      setCart([]);
      setSelectedCustomerId('');
      setShowNewCustomerForm(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setUseWholesalePrice(false);
      setAdditionalFee(0);
      setDiscount(0);
      fetchProducts();

      setShowReceiptModal(true);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Transaksi gagal');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[calc(100vh-250px)] overflow-y-auto">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 cursor-pointer transition"
            >
              <h3 className="font-semibold text-textPrimary truncate">
                {product.name}
              </h3>
              {product.brand && (
                <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
              )}
              <p className="text-lg font-bold text-primary mt-2">
                Rp {product.hargaJual.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Stok: {product.stock}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
        <h2 className="text-xl font-bold text-textPrimary mb-4 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Keranjang
        </h2>

        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Keranjang kosong</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-600">
                      Rp {(useWholesalePrice ? item.hargaReseller : item.hargaJual).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="bg-gray-200 hover:bg-gray-300 rounded p-1"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="bg-gray-200 hover:bg-gray-300 rounded p-1"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-bold text-primary">
                    Rp {((useWholesalePrice ? item.hargaReseller : item.hargaJual) * item.quantity).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Pelanggan (opsional)
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                if (e.target.value === 'new') {
                  setShowNewCustomerForm(true);
                  setSelectedCustomerId('');
                } else {
                  setSelectedCustomerId(e.target.value);
                  setShowNewCustomerForm(false);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">-- Pilih Pelanggan --</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone} (Points: {customer.points})
                </option>
              ))}
              <option value="new">+ Pelanggan Baru</option>
            </select>
          </div>

          {showNewCustomerForm && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  placeholder="Nama pelanggan"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  No. WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setShowNewCustomerForm(false);
                  setNewCustomerName('');
                  setNewCustomerPhone('');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Batalkan
              </button>
            </>
          )}

          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-200">
            <label className="text-sm font-medium text-textPrimary cursor-pointer">
              Gunakan Harga Grosir
            </label>
            <input
              type="checkbox"
              checked={useWholesalePrice}
              onChange={(e) => setUseWholesalePrice(e.target.checked)}
              className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Additional (Ongkir, dll)
            </label>
            <input
              type="number"
              placeholder="0"
              value={additionalFee || ''}
              onChange={(e) => setAdditionalFee(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Diskon
            </label>
            <input
              type="number"
              placeholder="0"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="CASH">Tunai</option>
            <option value="DEBIT">Debit</option>
            <option value="QRIS">QRIS</option>
            <option value="TRANSFER">Transfer</option>
          </select>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">
                Rp {calculateSubtotal().toLocaleString('id-ID')}
              </span>
            </div>
            {additionalFee > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Additional:</span>
                <span className="font-semibold text-green-600">
                  + Rp {additionalFee.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Diskon:</span>
                <span className="font-semibold text-red-600">
                  - Rp {discount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
              <span className="font-semibold text-textPrimary">Total:</span>
              <span className="text-2xl font-bold text-primary">
                Rp {calculateTotal().toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Checkout'}
          </button>
        </div>
      </div>

      <ReceiptModal
        transaction={lastTransaction}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
}