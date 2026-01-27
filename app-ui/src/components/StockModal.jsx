import { useState, useEffect } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { authFetch } from '../utils/api';
import '../styles/StockModal.css';

function StockModal({ type, product, onClose, onUpdate }) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when product changes
  useEffect(() => {
    setQuantity('');
    setReason('');
    setReference('');
    setError('');
  }, [product]);

  if (!product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    if (type === 'out' && parseInt(quantity) > product.stockQuantity) {
      setError(`Cannot remove ${quantity}. Only ${product.stockQuantity} in stock.`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await authFetch('http://localhost:3001/api/inventory/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: product.id,
          type: type.toUpperCase(), // 'IN' or 'OUT'
          quantity: parseInt(quantity),
          reason: reason || (type === 'in' ? 'Stock Refill' : 'Manual Reduction'),
          reference
        })
      });

      const data = await response.json();

      if (data.success) {
        onUpdate(); // Refresh parent data
        onClose();
      } else {
        setError(data.error || 'Failed to update stock');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stock-modal-overlay" onClick={onClose}>
      <div className="stock-modal" onClick={e => e.stopPropagation()}>
        <div className="stock-modal-header">
          <h2 className={type}>
            {type === 'in' ? <ArrowUpCircle size={28} /> : <ArrowDownCircle size={28} />}
            {type === 'in' ? 'Add Stock' : 'Remove Stock'}
          </h2>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-product-info">
          <p>Product: <strong>{product.name}</strong></p>
          <p>Current Stock: <strong>{product.stockQuantity}</strong></p>
          {product.barcode && <p>Barcode: {product.barcode}</p>}
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form className="stock-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Quantity</label>
            <input 
              type="number" 
              min="1" 
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>Reason (Optional)</label>
            <input 
              type="text" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={type === 'in' ? "e.g., New Shipment" : "e.g., Damaged, Expired"}
            />
          </div>

          <div className="form-group">
            <label>Reference # (Optional)</label>
            <input 
              type="text" 
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Delivery note, invoice no."
            />
          </div>

          <div className="stock-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={`btn-submit ${type}`} disabled={submitting}>
              {submitting ? 'Updating...' : type === 'in' ? 'Add to Stock' : 'Remove from Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockModal;
