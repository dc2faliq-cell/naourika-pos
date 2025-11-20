import { forwardRef } from 'react';
import { format } from 'date-fns';

interface ReceiptProps {
  transaction: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paymentMethod: string;
    customerName?: string;
    customerPhone?: string;
    createdAt: string;
    items: Array<{
      quantity: number;
      price: number;
      subtotal: number;
      product: {
        name: string;
        brand?: string;
      };
    }>;
    user: {
      fullName: string;
    };
    additionalFee?: number;
    discount?: number;
    useWholesalePrice?: boolean;
  };
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ transaction }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-white p-8 max-w-md mx-auto print:max-w-full print:p-2"
      style={{ fontFamily: 'monospace' }}
    >
      {/* Header Toko */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-2xl font-bold print:text-xl">NOURIKA BABY FOOD</h1>
        <p className="text-sm mt-1 print:text-xs">Toko Ulin Jaya</p>
        <p className="text-sm mt-1 print:text-xs">Jl. Raya Kudus-Colo, Dawe, Kudus</p>
        <p className="text-sm print:text-xs">Telp: 081908222254</p>
      </div>

      {/* Info Transaksi */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3 text-sm">
        <div className="flex justify-between mb-1">
          <span>No. Invoice:</span>
          <span className="font-bold">{transaction.invoiceNumber}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Tanggal:</span>
          <span>{format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}</span>
        </div>
        {transaction.customerName && (
          <div className="flex justify-between mb-1">
            <span>Pelanggan:</span>
            <span>{transaction.customerName}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2">Item</th>
              <th className="text-center py-2">Qty</th>
              <th className="text-right py-2">Harga</th>
              <th className="text-right py-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2">
                  <div className="font-semibold">{item.product.name}</div>
                  {item.product.brand && (
                    <div className="text-xs text-gray-600">{item.product.brand}</div>
                  )}
                </td>
                <td className="text-center py-2">{item.quantity}</td>
                <td className="text-right py-2">
                  Rp {item.price.toLocaleString('id-ID')}
                </td>
                <td className="text-right py-2 font-semibold">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="border-b-2 border-black pb-3 mb-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm mb-2">
          <span>Subtotal:</span>
          <span className="font-semibold">
            Rp {transaction.items.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('id-ID')}
          </span>
        </div>

        {/* Additional Fee */}
        {transaction.additionalFee && transaction.additionalFee > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span>Additional (Ongkir):</span>
            <span className="font-semibold text-green-600">
              + Rp {transaction.additionalFee.toLocaleString('id-ID')}
            </span>
          </div>
        )}

        {/* Discount */}
        {transaction.discount && transaction.discount > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span>Diskon:</span>
            <span className="font-semibold text-red-600">
              - Rp {transaction.discount.toLocaleString('id-ID')}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between text-lg font-bold border-t border-dashed border-gray-400 pt-2 mt-2">
          <span>TOTAL:</span>
          <span>Rp {transaction.totalAmount.toLocaleString('id-ID')}</span>
        </div>

        <div className="flex justify-between text-sm mt-2">
          <span>Metode Bayar:</span>
          <span className="font-semibold">{transaction.paymentMethod}</span>
        </div>

        {/* Wholesale Price Indicator */}
        {transaction.useWholesalePrice && (
          <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded mt-2 text-center">
            * Harga Grosir Digunakan
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 mt-4">
        <p>Terima kasih, Semoga Sikecil</p>
        <p className="mt-2">Makin Lahap Makannya</p>
      </div>

      {/* Barcode/QR Placeholder */}
      <div className="text-center mt-4 pt-4 border-t border-gray-300">
        <div className="inline-block bg-gray-200 px-4 py-2 text-xs">
          {transaction.invoiceNumber}
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;