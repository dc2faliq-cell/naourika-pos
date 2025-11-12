import { useState, useEffect } from 'react';
import api from '../lib/api';
import { DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDate]);

  const fetchReport = async () => {
    try {
      if (reportType === 'daily') {
        const response = await api.get(`/reports/daily?date=${selectedDate}`);
        setReportData(response.data);
        
        // Chart data untuk daily (hourly breakdown)
        const hourlyData: any = {};
        response.data.transactions?.forEach((t: any) => {
          const hour = new Date(t.createdAt).getHours();
          if (!hourlyData[hour]) {
            hourlyData[hour] = { hour: `${hour}:00`, revenue: 0, count: 0 };
          }
          hourlyData[hour].revenue += t.totalAmount;
          hourlyData[hour].count += 1;
        });
        setChartData(Object.values(hourlyData));

      } else {
        const date = new Date(selectedDate);
        const response = await api.get(
          `/reports/monthly?year=${date.getFullYear()}&month=${date.getMonth() + 1}`
        );
        setReportData(response.data);

        // Chart data untuk monthly (daily breakdown)
        const dailyData = response.data.dailyData || {};
        const chartArray = Object.keys(dailyData).map((day) => ({
          day: `Tgl ${day}`,
          revenue: dailyData[day].revenue,
          profit: dailyData[day].profit || 0,
          count: dailyData[day].count,
        }));
        setChartData(chartArray);
      }

      // Top products
      const productSales: any = {};
      reportData?.transactions?.forEach((t: any) => {
        t.items?.forEach((item: any) => {
          const pid = item.product.id;
          if (!productSales[pid]) {
            productSales[pid] = {
              name: item.product.name,
              brand: item.product.brand,
              qty: 0,
              revenue: 0,
            };
          }
          productSales[pid].qty += item.quantity;
          productSales[pid].revenue += item.subtotal;
        });
      });

      const topProds = Object.values(productSales)
        .sort((a: any, b: any) => b.qty - a.qty)
        .slice(0, 5);
      setTopProducts(topProds);

      // Payment methods distribution
      const paymentStats: any = {};
      reportData?.transactions?.forEach((t: any) => {
        if (!paymentStats[t.paymentMethod]) {
          paymentStats[t.paymentMethod] = { method: t.paymentMethod, count: 0, value: 0 };
        }
        paymentStats[t.paymentMethod].count += 1;
        paymentStats[t.paymentMethod].value += t.totalAmount;
      });
      setPaymentMethods(Object.values(paymentStats));

    } catch (error) {
      console.error('Failed to fetch report', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-textPrimary">Laporan</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setReportType('daily')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                reportType === 'daily'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-textPrimary hover:bg-gray-300'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                reportType === 'monthly'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-textPrimary hover:bg-gray-300'
              }`}
            >
              Bulanan
            </button>
          </div>

          <input
            type={reportType === 'daily' ? 'date' : 'month'}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        {reportData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-textPrimary">
                      Rp {reportData.totalRevenue.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Keuntungan</p>
                    <p className="text-2xl font-bold text-textPrimary">
                      Rp {(reportData.totalProfit || 0).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Margin: {reportData.totalRevenue > 0 
                        ? Math.round((reportData.totalProfit / reportData.totalRevenue) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500 p-3 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Transaksi</p>
                    <p className="text-2xl font-bold text-textPrimary">
                      {reportData.totalTransactions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="bg-accent p-3 rounded-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rata-rata</p>
                    <p className="text-2xl font-bold text-textPrimary">
                      Rp{' '}
                      {reportData.totalTransactions > 0
                        ? Math.round(
                            reportData.totalRevenue / reportData.totalTransactions
                          ).toLocaleString('id-ID')
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            {chartData.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-textPrimary mb-4">
                  Grafik Pendapatan {reportType === 'daily' ? '(Per Jam)' : '(Per Hari)'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={reportType === 'daily' ? 'hour' : 'day'} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => `Rp ${value.toLocaleString('id-ID')}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0f62fe"
                      strokeWidth={2}
                      name="Pendapatan"
                    />
                    {reportType === 'monthly' && (
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Keuntungan"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Products */}
            {topProducts.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-textPrimary mb-4">
                  Top Produk Terjual
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={topProducts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="qty" fill="#0f62fe" name="Qty Terjual" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {topProducts.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{item.name}</p>
                            {item.brand && (
                              <p className="text-xs text-gray-500">{item.brand}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary text-sm">
                            {item.qty} terjual
                          </p>
                          <p className="text-xs text-gray-500">
                            Rp {item.revenue.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods Distribution */}
            {paymentMethods.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-textPrimary mb-4">
                  Metode Pembayaran
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        dataKey="count"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry: any) => `${entry.method}: ${entry.count}`}
                      >
                        {paymentMethods.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={['#0f62fe', '#ff7a59', '#10b981', '#f59e0b'][index % 4]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {paymentMethods.map((pm: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{
                              backgroundColor: ['#0f62fe', '#ff7a59', '#10b981', '#f59e0b'][index % 4],
                            }}
                          />
                          <p className="font-semibold text-sm">{pm.method}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary text-sm">
                            {pm.count} transaksi
                          </p>
                          <p className="text-xs text-gray-500">
                            Rp {pm.value.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-textPrimary mb-4">
                Detail Transaksi
              </h3>
              <div className="space-y-2">
                {reportData.transactions?.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-textPrimary">
                        {transaction.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(transaction.createdAt), 'dd MMM yyyy HH:mm')}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      Rp {transaction.totalAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}