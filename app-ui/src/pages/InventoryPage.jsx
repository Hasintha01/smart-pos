import { useState, useEffect } from 'react';
import { Package, Plus, Minus, Edit, AlertTriangle, TrendingUp, TrendingDown, ClipboardList } from 'lucide-react';
import StockModal from '../components/StockModal';
import { authFetch } from '../utils/api';
import Loading from '../components/Loading';
import '../styles/InventoryPage.css';

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('in'); // 'in' or 'out'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'low', 'out'

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await authFetch('http://localhost:3001/api/inventory/summary');
      const data = await response.json();

      if (data.success) {
        setInventory(data.data.products);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockIn = (product) => {
    setSelectedProduct(product);
    setModalType('in');
    setShowModal(true);
  };

  const handleStockOut = (product) => {
    setSelectedProduct(product);
    setModalType('out');
    setShowModal(true);
  };

  const getStockStatus = (product) => {
    if (product.stockQuantity === 0) return 'out';
    if (product.stockQuantity <= product.reorderLevel) return 'low';
    return 'ok';
  };

  const filteredInventory = inventory.filter(product => {
    if (filter === 'out') return product.stockQuantity === 0;
    if (filter === 'low') return product.stockQuantity > 0 && product.stockQuantity <= product.reorderLevel;
    return true;
  });

  const formatCurrency = (val) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val);

  if (loading) {
    return <Loading message="Loading inventory..." />;
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h1><ClipboardList size={28} /> Inventory Management</h1>
          <p>Track and manage product stock levels</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Package size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{stats?.totalProducts || 0}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon low">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{stats?.lowStock || 0}</span>
            <span className="stat-label">Low Stock</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon out">
            <TrendingDown size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{stats?.outOfStock || 0}</span>
            <span className="stat-label">Out of Stock</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon value">
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{formatCurrency(stats?.totalValue || 0)}</span>
            <span className="stat-label">Total Value</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="inventory-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Products
        </button>
        <button 
          className={filter === 'low' ? 'active' : ''}
          onClick={() => setFilter('low')}
        >
          Low Stock ({stats?.lowStock})
        </button>
        <button 
          className={filter === 'out' ? 'active' : ''}
          onClick={() => setFilter('out')}
        >
          Out of Stock ({stats?.outOfStock})
        </button>
      </div>

      {/* Inventory Table */}
      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Barcode</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Reorder Level</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(product => {
              const status = getStockStatus(product);
              return (
                <tr key={product.id} className={`status-${status}`}>
                  <td className="product-name">{product.name}</td>
                  <td>{product.barcode || '-'}</td>
                  <td>{product.category}</td>
                  <td className="stock-quantity">
                    <strong>{product.stockQuantity}</strong>
                  </td>
                  <td>{product.reorderLevel}</td>
                  <td>
                    <span className={`status-badge status-${status}`}>
                      {status === 'out' && 'Out of Stock'}
                      {status === 'low' && 'Low Stock'}
                      {status === 'ok' && 'In Stock'}
                    </span>
                  </td>
                  <td>{new Date(product.updatedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-stock-in"
                        onClick={() => handleStockIn(product)}
                        title="Add Stock"
                      >
                        <Plus size={16} /> In
                      </button>
                      <button 
                        className="btn-stock-out"
                        onClick={() => handleStockOut(product)}
                        disabled={product.stockQuantity === 0}
                        title="Remove Stock"
                      >
                        <Minus size={16} /> Out
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredInventory.length === 0 && (
          <div className="empty-state">
            <Package size={48} />
            <p>No products found {filter !== 'all' ? `in ${filter} stock` : ''}</p>
          </div>
        )}
      </div>

      {showModal && (
        <StockModal
          product={selectedProduct}
          type={modalType}
          onClose={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
          onUpdate={() => {
            fetchInventory();
            setShowModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

export default InventoryPage;
