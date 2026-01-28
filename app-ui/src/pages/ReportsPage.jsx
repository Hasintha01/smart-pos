import { useState, useEffect } from 'react';
import { FileText, Download, Printer, Calendar, Filter, TrendingUp, Users, CreditCard, Package } from 'lucide-react';
import { authFetch } from '../utils/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/ReportsPage.css';

function ReportsPage() {
  const [reportType, setReportType] = useState('sales-summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default dates (last 7 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authFetch(
        `http://localhost:3001/api/reports/${reportType}?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
      } else {
        setError(data.message || 'Failed to fetch report');
      }
    } catch (err) {
      setError('Failed to fetch report. Please try again.');
      console.error('Report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    let wsData = [];
    let filename = `${reportType}_${startDate}_${endDate}.xlsx`;

    // Prepare data based on report type
    switch (reportType) {
      case 'sales-summary':
        wsData = reportData.sales.map(sale => ({
          'Sale ID': sale.id,
          'Date': new Date(sale.createdAt).toLocaleString(),
          'Cashier': sale.user.fullName,
          'Total': sale.total,
          'Items': sale.items.length,
          'Payment Method': sale.payments[0]?.paymentMethod || 'N/A'
        }));
        break;

      case 'sales-by-product':
        wsData = reportData.map(item => ({
          'Product': item.productName,
          'Barcode': item.barcode,
          'Category': item.category,
          'Quantity Sold': item.quantitySold,
          'Revenue': item.revenue.toFixed(2),
          'Profit': item.profit.toFixed(2)
        }));
        break;

      case 'sales-by-cashier':
        wsData = reportData.map(cashier => ({
          'Cashier': cashier.userName,
          'Username': cashier.username,
          'Role': cashier.role,
          'Transactions': cashier.transactionCount,
          'Total Sales': cashier.totalSales.toFixed(2),
          'Total Profit': cashier.totalProfit.toFixed(2)
        }));
        break;

      case 'payment-methods':
        wsData = reportData.breakdown.map(method => ({
          'Payment Method': method.paymentMethod,
          'Transactions': method.count,
          'Total Amount': method.totalAmount.toFixed(2),
          'Percentage': method.percentage.toFixed(2) + '%'
        }));
        break;

      case 'profit-analysis':
        wsData = reportData.categoryBreakdown.map(cat => ({
          'Category': cat.category,
          'Revenue': cat.revenue.toFixed(2),
          'Cost': cat.cost.toFixed(2),
          'Profit': cat.profit.toFixed(2),
          'Margin %': cat.margin.toFixed(2)
        }));
        break;
    }

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename);
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add title
    doc.setFontSize(18);
    doc.text(getReportTitle(), pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Period: ${startDate} to ${endDate}`, pageWidth / 2, 22, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });

    let tableData = [];
    let headers = [];

    // Prepare data based on report type
    switch (reportType) {
      case 'sales-summary':
        headers = ['Sale ID', 'Date', 'Cashier', 'Total', 'Items'];
        tableData = reportData.sales.map(sale => [
          sale.id,
          new Date(sale.createdAt).toLocaleDateString(),
          sale.user.fullName,
          `Rs. ${sale.total.toFixed(2)}`,
          sale.items.length
        ]);
        
        // Add summary
        doc.setFontSize(12);
        doc.text('Summary:', 14, 35);
        doc.setFontSize(10);
        doc.text(`Total Sales: Rs. ${reportData.summary.totalSales.toFixed(2)}`, 14, 42);
        doc.text(`Total Transactions: ${reportData.summary.totalTransactions}`, 14, 48);
        doc.text(`Total Profit: Rs. ${reportData.summary.totalProfit.toFixed(2)}`, 14, 54);
        
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 60,
          theme: 'grid'
        });
        break;

      case 'sales-by-product':
        headers = ['Product', 'Category', 'Qty Sold', 'Revenue', 'Profit'];
        tableData = reportData.map(item => [
          item.productName,
          item.category,
          item.quantitySold,
          `Rs. ${item.revenue.toFixed(2)}`,
          `Rs. ${item.profit.toFixed(2)}`
        ]);
        
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 35,
          theme: 'grid'
        });
        break;

      case 'sales-by-cashier':
        headers = ['Cashier', 'Role', 'Transactions', 'Sales', 'Profit'];
        tableData = reportData.map(cashier => [
          cashier.userName,
          cashier.role,
          cashier.transactionCount,
          `Rs. ${cashier.totalSales.toFixed(2)}`,
          `Rs. ${cashier.totalProfit.toFixed(2)}`
        ]);
        
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 35,
          theme: 'grid'
        });
        break;

      case 'payment-methods':
        headers = ['Payment Method', 'Transactions', 'Amount', 'Percentage'];
        tableData = reportData.breakdown.map(method => [
          method.paymentMethod,
          method.count,
          `Rs. ${method.totalAmount.toFixed(2)}`,
          `${method.percentage.toFixed(2)}%`
        ]);
        
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 35,
          theme: 'grid'
        });
        break;

      case 'profit-analysis':
        headers = ['Category', 'Revenue', 'Cost', 'Profit', 'Margin %'];
        tableData = reportData.categoryBreakdown.map(cat => [
          cat.category,
          `Rs. ${cat.revenue.toFixed(2)}`,
          `Rs. ${cat.cost.toFixed(2)}`,
          `Rs. ${cat.profit.toFixed(2)}`,
          `${cat.margin.toFixed(2)}%`
        ]);
        
        // Add summary
        doc.setFontSize(12);
        doc.text('Summary:', 14, 35);
        doc.setFontSize(10);
        doc.text(`Total Revenue: Rs. ${reportData.summary.totalRevenue.toFixed(2)}`, 14, 42);
        doc.text(`Total Cost: Rs. ${reportData.summary.totalCost.toFixed(2)}`, 14, 48);
        doc.text(`Total Profit: Rs. ${reportData.summary.totalProfit.toFixed(2)}`, 14, 54);
        doc.text(`Profit Margin: ${reportData.summary.profitMargin.toFixed(2)}%`, 14, 60);
        
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 65,
          theme: 'grid'
        });
        break;
    }

    doc.save(`${reportType}_${startDate}_${endDate}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = () => {
    const titles = {
      'sales-summary': 'Sales Summary Report',
      'sales-by-product': 'Sales by Product Report',
      'sales-by-cashier': 'Cashier Performance Report',
      'payment-methods': 'Payment Methods Report',
      'profit-analysis': 'Profit Analysis Report'
    };
    return titles[reportType] || 'Report';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1><FileText size={28} /> Reports & Analytics</h1>
          <p>Generate and export business intelligence reports</p>
        </div>
      </div>

      {/* Report Controls */}
      <div className="report-controls">
        <div className="control-group">
          <label><Filter size={18} /> Report Type</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="sales-summary">Sales Summary</option>
            <option value="sales-by-product">Sales by Product</option>
            <option value="sales-by-cashier">Cashier Performance</option>
            <option value="payment-methods">Payment Methods</option>
            <option value="profit-analysis">Profit Analysis</option>
          </select>
        </div>

        <div className="control-group">
          <label><Calendar size={18} /> Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="control-group">
          <label><Calendar size={18} /> End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button className="btn-generate" onClick={fetchReport} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {error && (
        <div className="error-banner">{error}</div>
      )}

      {/* Report Display */}
      {reportData && (
        <div className="report-display">
          <div className="report-actions no-print">
            <button className="btn-export" onClick={exportToExcel}>
              <Download size={18} /> Export Excel
            </button>
            <button className="btn-export" onClick={exportToPDF}>
              <Download size={18} /> Export PDF
            </button>
            <button className="btn-print" onClick={handlePrint}>
              <Printer size={18} /> Print
            </button>
          </div>

          <div className="report-content printable">
            <div className="report-title">
              <h2>{getReportTitle()}</h2>
              <p>Period: {startDate} to {endDate}</p>
              <p className="report-date">Generated: {new Date().toLocaleString()}</p>
            </div>

            {reportType === 'sales-summary' && (
              <div>
                <div className="report-summary">
                  <div className="summary-card">
                    <TrendingUp size={24} />
                    <div>
                      <p>Total Sales</p>
                      <h3>{formatCurrency(reportData.summary.totalSales)}</h3>
                    </div>
                  </div>
                  <div className="summary-card">
                    <FileText size={24} />
                    <div>
                      <p>Transactions</p>
                      <h3>{reportData.summary.totalTransactions}</h3>
                    </div>
                  </div>
                  <div className="summary-card">
                    <TrendingUp size={24} />
                    <div>
                      <p>Total Profit</p>
                      <h3>{formatCurrency(reportData.summary.totalProfit)}</h3>
                    </div>
                  </div>
                  <div className="summary-card">
                    <Package size={24} />
                    <div>
                      <p>Items Sold</p>
                      <h3>{reportData.summary.totalItemsSold}</h3>
                    </div>
                  </div>
                </div>

                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Sale ID</th>
                      <th>Date & Time</th>
                      <th>Cashier</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.sales.map(sale => (
                      <tr key={sale.id}>
                        <td>#{sale.id}</td>
                        <td>{new Date(sale.createdAt).toLocaleString()}</td>
                        <td>{sale.user.fullName}</td>
                        <td>{sale.items.length}</td>
                        <td>{formatCurrency(sale.total)}</td>
                        <td>{sale.payments[0]?.paymentMethod || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'sales-by-product' && (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Barcode</th>
                    <th>Category</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>{item.barcode}</td>
                      <td>{item.category}</td>
                      <td>{item.quantitySold}</td>
                      <td>{formatCurrency(item.revenue)}</td>
                      <td className={item.profit > 0 ? 'profit-positive' : 'profit-negative'}>
                        {formatCurrency(item.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'sales-by-cashier' && (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Cashier</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Transactions</th>
                    <th>Total Sales</th>
                    <th>Total Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((cashier, index) => (
                    <tr key={index}>
                      <td>{cashier.userName}</td>
                      <td>{cashier.username}</td>
                      <td>{cashier.role}</td>
                      <td>{cashier.transactionCount}</td>
                      <td>{formatCurrency(cashier.totalSales)}</td>
                      <td>{formatCurrency(cashier.totalProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'payment-methods' && (
              <div>
                <div className="payment-summary">
                  <h3>Total: {formatCurrency(reportData.total)}</h3>
                </div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Payment Method</th>
                      <th>Transactions</th>
                      <th>Amount</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.breakdown.map((method, index) => (
                      <tr key={index}>
                        <td>{method.paymentMethod}</td>
                        <td>{method.count}</td>
                        <td>{formatCurrency(method.totalAmount)}</td>
                        <td>{method.percentage.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'profit-analysis' && (
              <div>
                <div className="report-summary">
                  <div className="summary-card">
                    <TrendingUp size={24} />
                    <div>
                      <p>Total Revenue</p>
                      <h3>{formatCurrency(reportData.summary.totalRevenue)}</h3>
                    </div>
                  </div>
                  <div className="summary-card">
                    <Package size={24} />
                    <div>
                      <p>Total Cost</p>
                      <h3>{formatCurrency(reportData.summary.totalCost)}</h3>
                    </div>
                  </div>
                  <div className="summary-card profit">
                    <TrendingUp size={24} />
                    <div>
                      <p>Total Profit</p>
                      <h3>{formatCurrency(reportData.summary.totalProfit)}</h3>
                    </div>
                  </div>
                  <div className="summary-card">
                    <FileText size={24} />
                    <div>
                      <p>Profit Margin</p>
                      <h3>{reportData.summary.profitMargin.toFixed(2)}%</h3>
                    </div>
                  </div>
                </div>

                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Revenue</th>
                      <th>Cost</th>
                      <th>Profit</th>
                      <th>Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.categoryBreakdown.map((cat, index) => (
                      <tr key={index}>
                        <td>{cat.category}</td>
                        <td>{formatCurrency(cat.revenue)}</td>
                        <td>{formatCurrency(cat.cost)}</td>
                        <td className={cat.profit > 0 ? 'profit-positive' : 'profit-negative'}>
                          {formatCurrency(cat.profit)}
                        </td>
                        <td>{cat.margin.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Generating report...</p>
        </div>
      )}

      {!reportData && !loading && (
        <div className="empty-state">
          <FileText size={64} />
          <h3>No Report Generated</h3>
          <p>Select report type and date range, then click "Generate Report"</p>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
