import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package } from 'lucide-react';
import '../styles/Navigation.css';

function Navigation() {
  return (
    <nav className="main-nav">
      <div className="nav-brand">
        <h2>Smart POS</h2>
      </div>
      <div className="nav-links">
        <NavLink to="/pos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <ShoppingCart size={18} />
          <span>POS</span>
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Package size={18} />
          <span>Products</span>
        </NavLink>
      </div>
    </nav>
  );
}

export default Navigation;
