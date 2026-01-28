import { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, X, Save, Package } from 'lucide-react';
import { authFetch } from '../utils/api';
import Loading from '../components/Loading';
import '../styles/CategoriesPage.css';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await authFetch('http://localhost:3001/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const url = editingCategory
        ? `http://localhost:3001/api/categories/${editingCategory.id}`
        : 'http://localhost:3001/api/categories';

      const response = await authFetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchCategories();
        closeModal();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('Failed to save category');
    }
  };

  const handleDelete = async (category) => {
    if (category._count?.products > 0) {
      setError(`Cannot delete "${category.name}" - it has ${category._count.products} product(s)`);
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!confirm(`Delete category "${category.name}"?`)) {
      return;
    }

    try {
      const response = await authFetch(`http://localhost:3001/api/categories/${category.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchCategories();
      } else {
        setError(data.message || 'Failed to delete category');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError('Failed to delete category');
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) {
    return <Loading message="Loading categories..." />;
  }

  return (
    <div className="categories-page">
      <div className="categories-header">
        <div>
          <h1><Tag size={28} /> Categories</h1>
          <p>Organize your products into categories</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      <div className="categories-grid">
        {categories.map(category => (
          <div key={category.id} className="category-card">
            <div className="category-icon">
              <Tag size={32} />
            </div>
            <div className="category-info">
              <h3>{category.name}</h3>
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
              <div className="category-stats">
                <Package size={16} />
                <span>{category._count?.products || 0} products</span>
              </div>
            </div>
            <div className="category-actions">
              <button
                className="btn-icon btn-edit"
                onClick={() => openEditModal(category)}
                title="Edit category"
              >
                <Edit2 size={18} />
              </button>
              <button
                className="btn-icon btn-delete"
                onClick={() => handleDelete(category)}
                title="Delete category"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="empty-state">
            <Tag size={64} />
            <h3>No Categories Yet</h3>
            <p>Create your first category to organize products</p>
            <button className="btn-primary" onClick={openAddModal}>
              <Plus size={20} />
              Create Category
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button onClick={closeModal} className="btn-close">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="category-form">
              {error && (
                <div className="form-error">{error}</div>
              )}

              <div className="form-group">
                <label htmlFor="name">Category Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Beverages, Snacks, Electronics"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for this category"
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={18} />
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;
