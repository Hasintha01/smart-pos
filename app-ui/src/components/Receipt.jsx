import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import '../styles/Receipt.css';

function Receipt({ sale, onClose }) {
  const receiptRef = useRef();

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const totalItems = sale.items.reduce((sum, item) => sum + item.qty, 0);
  const currentDate = new Date().toLocaleString('en-LK');

  return (
    <div className="receipt-overlay">
      <div className="receipt-modal">
        <div className="receipt-actions no-print">
          <button className="btn-print" onClick={handlePrint}>
            <Printer size={18} />
            <span>Print Receipt</span>
          </button>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
            <span>Close</span>
          </button>
        </div>

        <div ref={receiptRef} className="receipt-content">
          <div className="receipt-header">
            <h2>SMART POS</h2>
            <p>Point of Sale System</p>
            <p>Sri Lanka</p>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-info">
            <div className="info-row">
              <span>Date:</span>
              <span>{currentDate}</span>
            </div>
            <div className="info-row">
              <span>Receipt #:</span>
              <span>{sale.saleId || 'N/A'}</span>
            </div>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-items">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>{formatCurrency(item.price || item.sellingPrice)}</td>
                    <td>{formatCurrency((item.price || item.sellingPrice) * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="total-row">
                <span>Discount:</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span>TOTAL:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
            <div className="total-row">
              <span>Paid ({sale.paymentType}):</span>
              <span>{formatCurrency(sale.cash || sale.total)}</span>
            </div>
            {sale.balance > 0 && (
              <div className="total-row">
                <span>Change:</span>
                <span>{formatCurrency(sale.balance)}</span>
              </div>
            )}
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-footer">
            <p>Total Items: {totalItems}</p>
            <p>Payment Method: {sale.paymentType.toUpperCase()}</p>
            <p className="thank-you">Thank You!</p>
            <p>Please come again</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Receipt;
