import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  TrendingUp, ShoppingCart, AlertTriangle, DollarSign, 
  Package, Clock, ArrowRight, RefreshCw 
} from 'lucide-react';
import { authFetch } from '../utils/api';
import '../styles/DashboardPage.css';

function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [statsRes, trendRes, salesRes, productsRes] = await Promise.all([
        authFetch('http://localhost:3001/api/dashboard/stats'),
        authFetch('http://localhost:3001/api/dashboard/sales-trend?days=7'),
        authFetch('http://localhost:3001/api/dashboard/recent-sales?limit=5'),
        authFetch('http://localhost:3001/api/dashboard/top-products?limit=5&period=month')
      ]);

      const statsData = await statsRes.json();
      const trendData = await trendRes.json();
      const salesData = await salesRes.json();
      const productsData = await productsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (trendData.success) {
        // Format dates for chart
        const formattedTrend = trendData.data.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
        })).reverse(); // Reverse to show chronological order
        setSalesTrend(formattedTrend);
      }
      if (salesData.success) setRecentSales(salesData.data);
      if (productsData.success) setTopProducts(productsData.data);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const handleManualRefresh = () => {
    fetchData();
  };

  if (loading && !stats) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="last-updated">
            <Clock size={14} /> 
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={handleManualRefresh} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="pos-btn" onClick={() => navigate('/pos')}>
            <ShoppingCart size={18} />
            Go to POS
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue" onClick={() => navigate('/reports')}>
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Today's Sales</h3>
            <div className="stat-value">{formatCurrency(stats?.today.sales || 0)}</div>
            <p className="stat-sub">{stats?.today.transactions || 0} Transactions</p>
          </div>
        </div>

        <div className="stat-card green" onClick={() => navigate('/reports')}>
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>Today's Profit</h3>
            <div className="stat-value">{formatCurrency(stats?.today.profit || 0)}</div>
            <p className="stat-sub">{stats?.today.itemsSold || 0} Items Sold</p>
          </div>
        </div>

        <div className="stat-card purple" onClick={() => navigate('/inventory')}>
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <h3>Inventory Value</h3>
            <div className="stat-value">{stats?.inventory.totalProducts || 0}</div>
            <p className="stat-sub">Total Products</p>
          </div>
        </div>

        <div className="stat-card red" onClick={() => navigate('/inventory?filter=low')}>
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <h3>Low Stock</h3>
            <div className="stat-value">{stats?.inventory.lowStock || 0}</div>
            <p className="stat-sub">{stats?.inventory.outOfStock || 0} Out of Stock</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Sales Chart */}
        <div className="chart-section">
          <div className="section-header">
            <h2>Sales Overview (Last 7 Days)</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelStyle={{ color: '#333' }}
                />
                <Bar dataKey="total" fill="#667eea" radius={[4, 4, 0, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-row-2">
          {/* Recent Sales */}
          <div className="recent-sales-section">
            <div className="section-header">
              <h2>Recent Transactions</h2>
              <button className="view-all-btn" onClick={() => navigate('/reports')}>
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="recent-sales-list">
              {recentSales.length > 0 ? (
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Cashier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{sale.saleItems.length} items</td>
                        <td className="amount">{formatCurrency(sale.total)}</td>
                        <td>{sale.user.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">No sales yet today</div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="top-products-section">
            <div className="section-header">
              <h2>Top Products (Month)</h2>
            </div>
            <div className="top-products-list">
              {topProducts.map((item, index) => (
                <div className="top-product-item" key={item.product.id}>
                  <div className="rank">#{index + 1}</div>
                  <div className="product-details">
                    <span className="name">{item.product.name}</span>
                    <span className="qty">{item.totalQuantity} sold</span>
                  </div>
                  <div className="revenue">{formatCurrency(item.totalRevenue)}</div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="empty-state">No sales data found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
