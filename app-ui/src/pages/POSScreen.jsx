import { useState, useEffect, useRef } from 'react';
import PaymentModal from '../components/PaymentModal';
import Receipt from '../components/Receipt';
import { authFetch } from '../utils/api';
import '../styles/POSScreen.css';

function POSScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCartIndex, setSelectedCartIndex] = useState(-1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await authFetch('http://localhost:3001/api/products');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
        setError(null);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const [filteredProducts, setFilteredProducts] = useState([]);

  // Auto focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filter products based on search
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.barcode.includes(query)
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice || item.price) * item.qty, 0);
  const discount = 0; // TODO: Add discount logic
  const total = subtotal - discount;

  // Add product to cart
  const addToCart = (product) => {
    // Check if product has stock
    if (!product.stockQuantity || product.stockQuantity === 0) {
      alert(`${product.name} is out of stock!`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.id === product.id);
    
    if (existingIndex >= 0) {
      // Check if we can add more
      const currentQty = cart[existingIndex].qty;
      if (currentQty + 1 > product.stockQuantity) {
        alert(`Only ${product.stockQuantity} units available in stock!`);
        return;
      }
      // Update quantity
      const newCart = [...cart];
      newCart[existingIndex].qty += 1;
      setCart(newCart);
    } else {
      // Add new item (normalize price field)
      setCart([...cart, { 
        ...product, 
        qty: 1,
        price: product.sellingPrice || product.price 
      }]);
    }
    
    // Clear search and refocus
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Update cart item quantity
  const updateQuantity = (index, change) => {
    const newCart = [...cart];
    const item = newCart[index];
    const newQty = item.qty + change;
    
    // Check stock availability when increasing
    if (change > 0 && newQty > item.stockQuantity) {
      alert(`Only ${item.stockQuantity} units available in stock!`);
      return;
    }
    
    if (newQty <= 0) {
      // Remove item if qty is 0
      newCart.splice(index, 1);
      setSelectedCartIndex(-1);
    } else {
      newCart[index].qty = newQty;
      setCart(newCart);
    }
  };

  // Remove cart item
  const removeCartItem = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    setSelectedCartIndex(-1);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2 - Focus search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // F10 - Open payment
      if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) {
          setShowPaymentModal(true);
        }
      }
      
      // Enter - Add first filtered product
      if (e.key === 'Enter' && document.activeElement === searchInputRef.current) {
        e.preventDefault();
        if (filteredProducts.length > 0) {
          addToCart(filteredProducts[0]);
        }
      }
      
      // Arrow keys for cart navigation
      if (cart.length > 0) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedCartIndex((prev) => Math.max(0, prev - 1));
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedCartIndex((prev) => Math.min(cart.length - 1, prev + 1));
        }
      }
      
      // +/- for quantity (when cart item selected)
      if (selectedCartIndex >= 0) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          updateQuantity(selectedCartIndex, 1);
        }
        if (e.key === '-') {
          e.preventDefault();
          updateQuantity(selectedCartIndex, -1);
        }
        if (e.key === 'Delete') {
          e.preventDefault();
          removeCartItem(selectedCartIndex);
        }
      }
      
      // Escape - Clear selection
      if (e.key === 'Escape') {
        setSelectedCartIndex(-1);
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCartIndex, filteredProducts]);

  // Handle payment completion
  const handlePaymentComplete = async (paymentData) => {
    try {
      // Prepare sale data
      const saleData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.qty,
          price: item.price || item.sellingPrice
        })),
        subtotal,
        discount,
        total,
        paymentType: paymentData.paymentType,
        cashAmount: paymentData.cash,
        changeAmount: paymentData.balance
      };

      // Save sale to backend
      const response = await authFetch('http://localhost:3001/api/sales', {
        method: 'POST',
        body: JSON.stringify(saleData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('Sale saved successfully:', result.data);
        
        // Prepare receipt data
        const receiptData = {
          saleId: result.data.id,
          items: cart,
          subtotal,
          discount,
          total,
          paymentType: paymentData.paymentType,
          cash: paymentData.cash,
          balance: paymentData.balance,
          timestamp: new Date()
        };
        
        // Close payment modal
        setShowPaymentModal(false);
        
        // Clear cart
        setCart([]);
        setSelectedCartIndex(-1);
        
        // Show receipt
        setLastSale(receiptData);
        setShowReceipt(true);
        
        // Refocus search
        searchInputRef.current?.focus();
      } else {
        console.error('Failed to save sale:', result.error);
        alert('Sale completed but failed to save: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Sale completed but failed to save. Check console for details.');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs. ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  return (
    <div className="pos-screen">
      {/* Main Content */}
      <div className="pos-content">
        {/* Left: Product Area */}
        <div className="product-area">
          <div className="search-section">
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search product or scan barcode... (F2)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {error && <div className="error-banner">{error}</div>}
          </div>

          {loading ? (
            <div className="loading-state">Loading products...</div>
          ) : (
            <>
              <div className="product-list">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="product-item"
                    onClick={() => addToCart(product)}
                  >
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">{formatCurrency(product.sellingPrice || product.price)}</div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && !loading && (
                <div className="no-products">No products found</div>
              )}
            </>
          )}
        </div>

        {/* Right: Cart Area */}
        <div className="cart-area">
          <h2>Cart</h2>
          
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Cart is empty</p>
              <p className="hint">Search and add products to start</p>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item, index) => (
                <div
                  key={item.id}
                  className={`cart-item ${index === selectedCartIndex ? 'selected' : ''}`}
                  onClick={() => setSelectedCartIndex(index)}
                >
                  <div className="item-name">{item.name}</div>
                  <div className="item-controls">
                    <button
                      className="qty-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(index, -1);
                      }}
                    >
                      -
                    </button>
                    <span className="item-qty">{item.qty}</span>
                    <button
                      className="qty-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(index, 1);
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div className="item-price">{formatCurrency(item.price || item.sellingPrice)}</div>
                  <div className="item-total">{formatCurrency((item.price || item.sellingPrice) * item.qty)}</div>
                  <button
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCartItem(index);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Totals */}
      <footer className="pos-footer">
        <div className="totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="total-row">
            <span>Discount:</span>
            <span>{formatCurrency(discount)}</span>
          </div>
          <div className="total-row total-main">
            <span>TOTAL:</span>
            <span className="total-amount">{formatCurrency(total)}</span>
          </div>
        </div>
        
        <button
          className="pay-btn"
          disabled={cart.length === 0}
          onClick={() => setShowPaymentModal(true)}
        >
          Pay (F10)
        </button>
        
        <div className="shortcuts">
          <span>F2: Search</span>
          <span>Enter: Add</span>
          <span>+/-: Qty</span>
          <span>Del: Remove</span>
          <span>F10: Pay</span>
        </div>
      </footer>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          total={total}
          onClose={() => setShowPaymentModal(false)}
          onComplete={handlePaymentComplete}
        />
      )}

      {/* Receipt */}
      {showReceipt && lastSale && (
        <Receipt
          sale={lastSale}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}

export default POSScreen;
