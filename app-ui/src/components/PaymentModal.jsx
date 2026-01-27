import { useState, useEffect, useRef } from 'react';
import '../styles/PaymentModal.css';

function PaymentModal({ total, onClose, onComplete }) {
  const [cashAmount, setCashAmount] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const cashInputRef = useRef(null);

  // Auto focus cash input
  useEffect(() => {
    cashInputRef.current?.focus();
  }, []);

  // Calculate balance
  const cash = parseFloat(cashAmount) || 0;
  const balance = cash - total;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape - Close modal
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      
      // Enter - Complete payment
      if (e.key === 'Enter' && cash >= total) {
        e.preventDefault();
        onComplete({
          total,
          cash,
          balance,
          paymentType,
          timestamp: new Date(),
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cash, total, balance, paymentType, onClose, onComplete]);

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs. ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handleComplete = () => {
    if (cash >= total) {
      onComplete({
        total,
        cash,
        balance,
        paymentType,
        timestamp: new Date(),
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="payment-modal">
        <div className="modal-header">
          <h2>Payment</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Total Display */}
          <div className="payment-total">
            <span>Total Amount</span>
            <span className="amount">{formatCurrency(total)}</span>
          </div>

          {/* Payment Type */}
          <div className="payment-types">
            <button
              className={`payment-type-btn ${paymentType === 'cash' ? 'active' : ''}`}
              onClick={() => setPaymentType('cash')}
            >
              Cash
            </button>
            <button
              className={`payment-type-btn ${paymentType === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentType('card')}
            >
              Card
            </button>
            <button
              className={`payment-type-btn ${paymentType === 'qr' ? 'active' : ''}`}
              onClick={() => setPaymentType('qr')}
            >
              QR
            </button>
          </div>

          {/* Cash Input */}
          {paymentType === 'cash' && (
            <div className="cash-input-section">
              <label>Cash Received</label>
              <input
                ref={cashInputRef}
                type="number"
                className="cash-input"
                placeholder="0.00"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                step="0.01"
              />
            </div>
          )}

          {/* Balance Display */}
          {paymentType === 'cash' && cash > 0 && (
            <div className={`balance-display ${balance >= 0 ? 'positive' : 'negative'}`}>
              <span>Balance</span>
              <span className="balance-amount">
                {balance >= 0 ? formatCurrency(balance) : formatCurrency(Math.abs(balance))}
              </span>
            </div>
          )}

          {/* Quick Cash Buttons */}
          {paymentType === 'cash' && (
            <div className="quick-cash">
              {[100, 500, 1000, 2000, 5000].map((amount) => (
                <button
                  key={amount}
                  className="quick-cash-btn"
                  onClick={() => setCashAmount(amount.toString())}
                >
                  {amount}
                </button>
              ))}
            </div>
          )}

          {/* Card/QR Message */}
          {(paymentType === 'card' || paymentType === 'qr') && (
            <div className="payment-message">
              <p>Complete {paymentType} payment of {formatCurrency(total)}</p>
              <p className="hint">Press Enter to confirm</p>
            </div>
          )}

          {/* Error Message */}
          {paymentType === 'cash' && cash > 0 && balance < 0 && (
            <div className="error-message">
              Insufficient amount. Need {formatCurrency(Math.abs(balance))} more.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel (Esc)
          </button>
          <button
            className="complete-btn"
            disabled={paymentType === 'cash' && cash < total}
            onClick={handleComplete}
          >
            Complete (Enter)
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
