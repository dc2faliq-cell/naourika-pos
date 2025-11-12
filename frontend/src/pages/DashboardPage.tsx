import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Package, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    todayProfit: 0,
    todayTransactions: 0,
    weeklyRevenue: 0,
    weeklyProfit: 0,
    monthlyRevenue: 0,
    monthlyProfit: 0,
    yearlyRevenue: 0,
    yearlyProfit: 0,
    lowStockProducts: 0,
    recentTransactions: [] as any[],
    topProducts: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [productsRes, transactionsRes] = await Promise.all([
        api.get('/products'),
        api.get('/transactions'),
      ]);

      const products = productsRes.data;
      const transactions = transactionsRes.data;

      // Calculate profit for each transaction
      const calculateTransactionProfit = (t: any) => {
        return t.items.reduce((sum: number, item: any) => {
          const profit = (item.price - item.product.hargaModal) * item.quantity;
          return sum + profit;
        }, 0);
      };

      const totalRevenue = transactions.reduce((sum: number, t: any) => sum + t.totalAmount, 0);
      const totalProfit = transactions.reduce((sum: number, t: any) => sum + calculateTransactionProfit(t), 0);

      // Date calculations
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      // Filter by period
      const todayTxs = transactions.filter((t: any) => new Date(t.createdAt) >= todayStart);
      const weekTxs = transactions.filter((t: any) => new Date(t.createdAt) >= weekStart);
      const monthTxs = transactions.filter((t: any) => new Date(t.createdAt) >= monthStart);
      const yearTxs = transactions.filter((t: any) => new Date(t.createdAt) >= yearStart);

      // Calculate revenue & profit by period
      const todayRevenue = todayTxs.reduce((sum: number, t: any) => sum + t.totalAmount, 0);
      const todayProfit = todayTxs.reduce((sum: number, t: any) => sum + calculateTransactionProfit(t), 0);
      const weeklyRevenue = weekTxs.reduce((sum: number, t: any) => sum + t.totalAmount, 0);
      const weeklyProfit = weekTxs.reduce((sum: number, t: any) => sum + calculateTransactionProfit(t), 0);
      const monthlyRevenue = monthTxs.reduce((sum: number, t: any) => sum + t.totalAmount, 0);
      const monthlyProfit = monthTxs.reduce((sum: number, t: any) => sum + calculateTransactionProfit(t), 0);
      const yearlyRevenue = yearTxs.reduce((sum: number, t: any) => sum + t.totalAmount, 0);
      const yearlyProfit = yearTxs.reduce((sum: number, t: any) => sum + calculateTransactionProfit(t), 0);

      // Top selling products
      const productSales: any = {};
      transactions.forEach((t: any) => {
        t.items.forEach((item: any) => {
          const pid = item.product.id;
          if (!productSales[pid]) {
            productSales[pid] = {
              product: item.product,
              totalQty: 0,
              totalRevenue: 0,
            };
          }
          productSales[pid].totalQty += item.quantity;
          productSales[pid].totalRevenue += item.subtotal;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.totalQty - a.totalQty)
        .slice(0, 5);

      // Low stock products (stock <= 5)
      const lowStock = products.filter((p: any) => p.stock <= 5 && p.isActive);

      // Recent transactions (last 5)
      const recent = transactions.slice(0, 5);

      setStats({
        totalProducts: products.filter((p: any) => p.isActive).length,
        totalTransactions: transactions.length,
        totalRevenue,
        todayRevenue,
        todayProfit,
        todayTransactions: todayTxs.length,
        weeklyRevenue,
        weeklyProfit,
        monthlyRevenue,
        monthlyProfit,
        yearlyRevenue,
        yearlyProfit,
        lowStockProducts: lowStock.length,
        recentTransactions: recent,
        topProducts,
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
    }
  };

  // Stat cards berbeda untuk Admin dan Kasir
  const statCards = user?.role === 'ADMIN' ? [
    {
      title: 'Pendapatan Hari Ini',
      value: `Rp ${stats.todayRevenue.toLocaleString('id-ID')}`,
      subtitle: `Transaksi: ${stats.todayTransactions}`,
      icon: DollarSign,
      color: 'bg-blue-500',
    },
    {
      title: 'Keuntungan Hari Ini',
      value: `Rp ${stats.todayProfit.toLocaleString('id-ID')}`,
      subtitle: `Margin: ${stats.todayRevenue > 0 ? Math.round((stats.todayProfit / stats.todayRevenue) * 100) : 0}%`,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Produk Aktif',
      value: stats.totalProducts,
      subtitle: stats.lowStockProducts > 0 ? `${stats.lowStockProducts} stok rendah` : 'Semua stok aman',
      icon: Package,
      color: 'bg-purple-500',
      alert: stats.lowStockProducts > 0,
    },
    {
      title: 'Rata-rata per Transaksi',
      value: stats.totalTransactions > 0 
        ? `Rp ${Math.round(stats.totalRevenue / stats.totalTransactions).toLocaleString('id-ID')}`
        : 'Rp 0',
      subtitle: `Total Transaksi: ${stats.totalTransactions}`,
      icon: ShoppingCart,
      color: 'bg-orange-500',
    },
  ] : [
    {
      title: 'Pendapatan Hari Ini',
      value: `Rp ${stats.todayRevenue.toLocaleString('id-ID')}`,
      subtitle: `${stats.todayTransactions} transaksi`,
      icon: DollarSign,
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Selamat datang, {user?.fullName}!
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
        >
          <svg
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className={`grid grid-cols-1 ${user?.role === 'ADMIN' ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-1'} gap-6`}>
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          statCards.map((stat, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-sm border p-6 ${
                stat.alert ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-textPrimary">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            </div>
          ))
        )}
      </div>

      {/* Revenue & Profit Analytics - Admin Only */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-textPrimary mb-4">
            Pendapatan & Keuntungan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-1">HARIAN</p>
              <p className="text-lg font-bold text-blue-900">
                Rp {stats.todayRevenue.toLocaleString('id-ID')}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Profit: Rp {stats.todayProfit.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <p className="text-xs text-green-700 font-medium mb-1">MINGGUAN (7 Hari)</p>
              <p className="text-lg font-bold text-green-900">
                Rp {stats.weeklyRevenue.toLocaleString('id-ID')}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Profit: Rp {stats.weeklyProfit.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <p className="text-xs text-purple-700 font-medium mb-1">BULANAN</p>
              <p className="text-lg font-bold text-purple-900">
                Rp {stats.monthlyRevenue.toLocaleString('id-ID')}
              </p>
              <p className="text-sm text-purple-700 mt-1">
                Profit: Rp {stats.monthlyProfit.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <p className="text-xs text-orange-700 font-medium mb-1">TAHUNAN</p>
              <p className="text-lg font-bold text-orange-900">
                Rp {stats.yearlyRevenue.toLocaleString('id-ID')}
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Profit: Rp {stats.yearlyProfit.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${user?.role === 'KASIR' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-textPrimary">
              Top Produk Terjual
            </h2>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => window.location.href = '/products'}
                className="text-sm text-primary hover:text-blue-700"
              >
                Lihat Semua →
              </button>
            )}
          </div>
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : stats.topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Belum ada data penjualan</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-textPrimary">
                        {item.product.name}
                      </p>
                      {item.product.brand && (
                        <p className="text-xs text-gray-500">{item.product.brand}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {item.totalQty} terjual
                    </p>
                    <p className="text-xs text-gray-500">
                      Rp {item.totalRevenue.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaksi Terbaru */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-textPrimary">
              Transaksi Terbaru
            </h2>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => window.location.href = '/reports'}
                className="text-sm text-primary hover:text-blue-700"
              >
                Lihat Semua →
              </button>
            )}
          </div>
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : stats.recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Belum ada transaksi</p>
          ) : (
            <div className="space-y-3">
              {stats.recentTransactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="font-semibold text-sm text-textPrimary">
                      {transaction.invoiceNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      Rp {transaction.totalAmount.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.paymentMethod}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stok Rendah */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-textPrimary">
              Stok Rendah
            </h2>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => window.location.href = '/products'}
                className="text-sm text-primary hover:text-blue-700"
              >
                Kelola Produk →
              </button>
            )}
          </div>
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : stats.lowStockProducts === 0 ? (
            <div className="text-center py-8">
              <div className="inline-block p-4 bg-green-100 rounded-full mb-3">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-green-600 font-semibold">
                Semua stok produk aman!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-orange-600 text-sm font-medium mb-3">
                ⚠️ {stats.lowStockProducts} produk perlu restok
              </p>
              <p className="text-gray-600 text-sm">
                {user?.role === 'ADMIN' 
                  ? 'Klik "Kelola Produk" untuk melihat detail produk dengan stok rendah (≤ 5 unit)'
                  : 'Ada produk dengan stok rendah (≤ 5 unit). Hubungi admin untuk restok.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}