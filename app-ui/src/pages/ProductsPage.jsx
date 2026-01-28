import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import { authFetch } from '../utils/api';
import { showSuccess, showError } from '../utils/toast';
import '../styles/ProductsPage.css';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await authFetch(`http://localhost:3001/api/products/${productId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Product deleted successfully');
        fetchProducts();
      } else {
        showError('Failed to delete product: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showError('Failed to delete product');
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      const url = editingProduct
        ? `http://localhost:3001/api/products/${editingProduct.id}`
        : 'http://localhost:3001/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(productData)
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(data.message);
        setShowModal(false);
        fetchProducts();
      } else {
        showError('Failed to save product: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showError('Failed to save product');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery)) ||
    (p.sku && p.sku.includes(searchQuery))
  );

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>Manage your inventory</p>
        </div>
        <button className="btn-primary" onClick={handleAddProduct}>
          <Plus size={20} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="search-bar">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Search by name, SKU, or barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading products...</div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="product-name-cell">{product.name}</td>
                    <td>{product.sku || '-'}</td>
                    <td>{product.barcode || '-'}</td>
                    <td>{product.category?.name || '-'}</td>
                    <td>{formatCurrency(product.costPrice)}</td>
                    <td className="price-cell">{formatCurrency(product.sellingPrice)}</td>
                    <td>
                      <span className={`quantity-badge ${product.quantity <= product.reorderLevel ? 'low-stock' : ''}`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditProduct(product)}
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => setShowModal(false)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

export default ProductsPage;
