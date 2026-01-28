import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, LogOut, User, LayoutDashboard, ClipboardList, FileText, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Navigation.css';

function Navigation() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-brand">
        <h2>Smart POS</h2>
      </div>
      <div className="nav-links">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/pos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <ShoppingCart size={18} />
          <span>POS</span>
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Package size={18} />
          <span>Products</span>
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <ClipboardList size={18} />
          <span>Inventory</span>
        </NavLink>
        {user?.role === 'ADMIN' && (
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <FileText size={18} />
            <span>Reports</span>
          </NavLink>
        )}
        {user?.role === 'ADMIN' && (
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        )}
      </div>
      <div className="nav-user">
        <div className="user-info">
          <User size={18} />
          <span>{user?.fullName}</span>
          <span className="user-role">({user?.role})</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
