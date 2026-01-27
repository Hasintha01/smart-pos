/**
 * Smart POS Frontend Application
 * Main App component with routing
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import POSScreen from './pages/POSScreen';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/pos" replace />} />
        <Route path="/pos" element={<POSScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
