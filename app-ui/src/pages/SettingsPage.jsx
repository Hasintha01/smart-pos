import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw, Store, Receipt, DollarSign, Package } from 'lucide-react';
import { authFetch } from '../utils/api';
import '../styles/SettingsPage.css';

function SettingsPage() {
  const [settings, setSettings] = useState({
    shopName: 'Smart POS',
    shopAddress: '',
    shopPhone: '',
    shopEmail: '',
    shopLogo: '',
    taxEnabled: false,
    taxPercentage: 0,
    taxLabel: 'VAT',
    currency: 'LKR',
    currencySymbol: 'Rs.',
    receiptHeader: '',
    receiptFooter: 'Thank you for your business!',
    showLogo: true,
    lowStockThreshold: 10
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('shop');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await authFetch('http://localhost:3001/api/settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!settings.shopName.trim()) {
      setMessage({ type: 'error', text: 'Shop name is required' });
      return;
    }

    if (settings.taxEnabled && (settings.taxPercentage < 0 || settings.taxPercentage > 100)) {
      setMessage({ type: 'error', text: 'Tax percentage must be between 0 and 100' });
      return;
    }

    if (settings.lowStockThreshold < 0) {
      setMessage({ type: 'error', text: 'Low stock threshold must be a positive number' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authFetch('http://localhost:3001/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setSettings(data.data);
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || data.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Save settings error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default values?')) {
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authFetch('http://localhost:3001/api/settings/reset', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Settings reset to default!' });
        setSettings(data.data);
        
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to reset settings' });
      }
    } catch (error) {
      console.error('Reset settings error:', error);
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1><SettingsIcon size={28} /> Settings & Configuration</h1>
          <p>Manage your shop settings and system configuration</p>
        </div>
        <div className="settings-actions">
          <button className="btn-reset" onClick={handleReset} disabled={saving}>
            <RotateCcw size={18} /> Reset to Default
          </button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-container">
        <div className="settings-tabs">
          <button
            className={`tab ${activeTab === 'shop' ? 'active' : ''}`}
            onClick={() => setActiveTab('shop')}
          >
            <Store size={20} /> Shop Information
          </button>
          <button
            className={`tab ${activeTab === 'tax' ? 'active' : ''}`}
            onClick={() => setActiveTab('tax')}
          >
            <DollarSign size={20} /> Tax & Currency
          </button>
          <button
            className={`tab ${activeTab === 'receipt' ? 'active' : ''}`}
            onClick={() => setActiveTab('receipt')}
          >
            <Receipt size={20} /> Receipt Settings
          </button>
          <button
            className={`tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Package size={20} /> System Settings
          </button>
        </div>

        <div className="settings-content">
          {/* Shop Information Tab */}
          {activeTab === 'shop' && (
            <div className="settings-section">
              <h2>Shop Information</h2>
              <p className="section-description">Basic information about your shop</p>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Shop Name *</label>
                  <input
                    type="text"
                    value={settings.shopName}
                    onChange={(e) => handleChange('shopName', e.target.value)}
                    placeholder="Enter shop name"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Shop Address</label>
                  <textarea
                    value={settings.shopAddress || ''}
                    onChange={(e) => handleChange('shopAddress', e.target.value)}
                    placeholder="Enter shop address"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={settings.shopPhone || ''}
                    onChange={(e) => handleChange('shopPhone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={settings.shopEmail || ''}
                    onChange={(e) => handleChange('shopEmail', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Shop Logo (Base64 or URL)</label>
                  <input
                    type="text"
                    value={settings.shopLogo || ''}
                    onChange={(e) => handleChange('shopLogo', e.target.value)}
                    placeholder="Enter logo URL or base64 data"
                  />
                  <small>You can paste a base64 encoded image or an image URL</small>
                </div>
              </div>
            </div>
          )}

          {/* Tax & Currency Tab */}
          {activeTab === 'tax' && (
            <div className="settings-section">
              <h2>Tax & Currency Settings</h2>
              <p className="section-description">Configure tax rates and currency display</p>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.taxEnabled}
                      onChange={(e) => handleChange('taxEnabled', e.target.checked)}
                    />
                    <span>Enable Tax Calculation</span>
                  </label>
                  <small>When enabled, tax will be automatically calculated on all sales</small>
                </div>

                {settings.taxEnabled && (
                  <>
                    <div className="form-group">
                      <label>Tax Label</label>
                      <input
                        type="text"
                        value={settings.taxLabel}
                        onChange={(e) => handleChange('taxLabel', e.target.value)}
                        placeholder="e.g., VAT, GST, Tax"
                      />
                    </div>

                    <div className="form-group">
                      <label>Tax Percentage (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.taxPercentage}
                        onChange={(e) => handleChange('taxPercentage', parseFloat(e.target.value) || 0)}
                        placeholder="Enter tax percentage"
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Currency Code</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    placeholder="e.g., LKR, USD, EUR"
                  />
                </div>

                <div className="form-group">
                  <label>Currency Symbol</label>
                  <input
                    type="text"
                    value={settings.currencySymbol}
                    onChange={(e) => handleChange('currencySymbol', e.target.value)}
                    placeholder="e.g., Rs., $, €"
                  />
                </div>
              </div>

              {settings.taxEnabled && (
                <div className="info-box">
                  <strong>Tax Preview:</strong> A sale of Rs. 1000 will have {settings.taxLabel} of Rs. {(1000 * settings.taxPercentage / 100).toFixed(2)} 
                  {' '}for a total of Rs. {(1000 + (1000 * settings.taxPercentage / 100)).toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Receipt Settings Tab */}
          {activeTab === 'receipt' && (
            <div className="settings-section">
              <h2>Receipt Settings</h2>
              <p className="section-description">Customize receipt appearance and content</p>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Receipt Header Text</label>
                  <textarea
                    value={settings.receiptHeader || ''}
                    onChange={(e) => handleChange('receiptHeader', e.target.value)}
                    placeholder="Optional header text (e.g., promotional message)"
                    rows="2"
                  />
                  <small>This text will appear at the top of receipts</small>
                </div>

                <div className="form-group full-width">
                  <label>Receipt Footer Text</label>
                  <textarea
                    value={settings.receiptFooter}
                    onChange={(e) => handleChange('receiptFooter', e.target.value)}
                    placeholder="Footer text (e.g., Thank you message)"
                    rows="2"
                  />
                  <small>This text will appear at the bottom of receipts</small>
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.showLogo}
                      onChange={(e) => handleChange('showLogo', e.target.checked)}
                    />
                    <span>Show Logo on Receipt</span>
                  </label>
                  <small>Display shop logo on printed receipts (if logo is configured)</small>
                </div>
              </div>

              <div className="receipt-preview">
                <h3>Receipt Preview</h3>
                <div className="preview-receipt">
                  {settings.showLogo && settings.shopLogo && (
                    <div className="preview-logo">[LOGO]</div>
                  )}
                  <div className="preview-shop-name">{settings.shopName}</div>
                  {settings.shopAddress && (
                    <div className="preview-address">{settings.shopAddress}</div>
                  )}
                  {settings.shopPhone && (
                    <div className="preview-phone">{settings.shopPhone}</div>
                  )}
                  {settings.receiptHeader && (
                    <div className="preview-header">{settings.receiptHeader}</div>
                  )}
                  <div className="preview-divider">---</div>
                  <div className="preview-items">
                    <div>Sample Item x 1 @ Rs. 100.00</div>
                    <div style={{ textAlign: 'right' }}>Rs. 100.00</div>
                  </div>
                  <div className="preview-divider">---</div>
                  <div className="preview-total">
                    <strong>Total: {settings.currencySymbol} 100.00</strong>
                  </div>
                  {settings.receiptFooter && (
                    <div className="preview-footer">{settings.receiptFooter}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'system' && (
            <div className="settings-section">
              <h2>System Settings</h2>
              <p className="section-description">Configure system-wide settings and defaults</p>

              <div className="form-grid">
                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.lowStockThreshold}
                    onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                    placeholder="Enter threshold"
                  />
                  <small>Products below this quantity will show low stock alert</small>
                </div>
              </div>

              <div className="info-box">
                <strong>Note:</strong> This threshold is used as the default for new products. 
                You can set individual thresholds per product in the Products page.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
