import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { X, Share2, MessageCircle, Printer } from 'lucide-react';
import Receipt from './Receipt';

interface ReceiptModalProps {
  transaction: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({ transaction, isOpen, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleShareReceipt = async () => {
    if (!receiptRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Gagal generate gambar');
          setIsDownloading(false);
          return;
        }

        const file = new File([blob], `Struk-${transaction.invoiceNumber}.png`, {
          type: 'image/png',
        });

        // Check if Web Share API is supported
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Struk Pembelian',
              text: `Struk transaksi ${transaction.invoiceNumber}`,
            });
          } catch (error: any) {
            if (error.name !== 'AbortError') {
              console.error('Error sharing:', error);
              // Fallback to download
              downloadImage(canvas);
            }
          }
        } else {
          // Fallback: Download image if share not supported
          downloadImage(canvas);
        }
        setIsDownloading(false);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating receipt image:', error);
      alert('Gagal generate struk');
      setIsDownloading(false);
    }
  };

  const downloadImage = (canvas: HTMLCanvasElement) => {
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Struk-${transaction.invoiceNumber}.png`;
    link.href = image;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const phone = transaction.customerPhone?.replace(/\D/g, '') || '';
    
    // Format pesan WhatsApp
    let message = `*NOURIKA BABY FOOD*\n\n`;
    message += `*INVOICE*\n\n`;
    message += `Tanggal: ${new Date(transaction.createdAt).toLocaleString('id-ID')}\n`;
    
    if (transaction.customerName) {
      message += `Pelanggan: ${transaction.customerName}\n`;
    }
    
    if (transaction.useWholesalePrice) {
      message += `_Harga Grosir Digunakan_\n`;
    }
    
    message += `\n*DETAIL PEMBELIAN:*\n`;
    message += `${'-'.repeat(35)}\n`;
    
    transaction.items.forEach((item: any) => {
      const itemName = item.product.brand 
        ? `${item.product.name} (${item.product.brand})`
        : item.product.name;
      message += `${item.quantity}x ${itemName}\n`;
      message += `  Rp ${item.price.toLocaleString('id-ID')} x ${item.quantity} = Rp ${item.subtotal.toLocaleString('id-ID')}\n\n`;
    });
    
    message += `${'-'.repeat(35)}\n`;
    
    // Subtotal
    const subtotal = transaction.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    message += `Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n`;
    
    // Additional Fee
    if (transaction.additionalFee && transaction.additionalFee > 0) {
      message += `Additional (Ongkir): + Rp ${transaction.additionalFee.toLocaleString('id-ID')}\n`;
    }
    
    // Discount
    if (transaction.discount && transaction.discount > 0) {
      message += `Diskon: - Rp ${transaction.discount.toLocaleString('id-ID')}\n`;
    }
    
    message += `${'-'.repeat(35)}\n`;
    message += `*TOTAL: Rp ${transaction.totalAmount.toLocaleString('id-ID')}*\n`;
    message += `Rekening Pembayaran\n`;
    message += `Bank BCA: 0319668855\n`;
    message += `a/n: Ulya Muhimmatul\n\n`;
    message += `Terima kasih sudah berbelanja`;

    // Encode pesan untuk URL
    const encodedMessage = encodeURIComponent(message);
    
    // Generate WhatsApp URL
    let whatsappUrl = '';
    if (phone) {
      // Pastikan nomor diawali dengan 62 (kode Indonesia)
      const formattedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
      whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    } else {
      // Jika tidak ada nomor, buka WhatsApp biasa dengan teks siap copy
      whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    }

    // Buka WhatsApp di tab baru
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-textPrimary">Struk Transaksi</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="p-4">
          <div id="receipt-print" className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <Receipt ref={receiptRef} transaction={transaction} />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>

          <button
            onClick={handleShareReceipt}
            disabled={isDownloading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Share2 className="w-5 h-5" />
            {isDownloading ? 'Processing...' : 'Share'}
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          body * {
            visibility: hidden;
          }
          
          #receipt-print * {
            visibility: visible;
          }
          
          #receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
          }
          
          /* Hide modal overlay and buttons when printing */
          .fixed, button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}