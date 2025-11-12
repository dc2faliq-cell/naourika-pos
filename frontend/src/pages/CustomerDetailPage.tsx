import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, Phone, Award, ShoppingBag, Calendar } from 'lucide-react';

interface Transaction {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  points: number;
  createdAt: string;
  transactions: Transaction[];
  totalSpending: number;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data);
    } catch (error) {
      console.error('Failed to fetch customer', error);
      alert('Customer not found');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!customer) {
    return <div className="p-6 text-center">Customer not found</div>;
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">{customer.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-semibold">{customer.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Points</p>
              <p className="font-semibold text-2xl text-primary">{customer.points}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Total Spending</p>
              <p className="font-semibold text-green-600">
                Rp {customer.totalSpending.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          Member since {new Date(customer.createdAt).toLocaleDateString('id-ID')}
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Purchase History</h2>
      {customer.transactions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No transactions yet</p>
      ) : (
        <div className="space-y-4">
          {customer.transactions.map((transaction) => (
            <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold">{transaction.invoiceNumber}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-primary">
                    Rp {transaction.totalAmount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-600">{transaction.paymentMethod}</p>
                </div>
              </div>
              <div className="border-t pt-3 space-y-2">
                {transaction.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}