/**
 * Smart POS Frontend Application
 * Main App component that connects to the backend API
 */

import { useEffect, useState } from 'react';

function App() {
  // State to hold the API status message
  const [msg, setMsg] = useState('Loading...');
  const [error, setError] = useState(null);

  // Fetch health status from backend API on component mount
  useEffect(() => {
    fetch('http://localhost:3001/health')
      .then(response => {
        if (!response.ok) {
          throw new Error('Backend connection failed');
        }
        return response.json();
      })
      .then(data => {
        setMsg(data.status);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setMsg('Unable to connect to backend');
      });
  }, []);

  return (
    <div style={{ 
      padding: '40px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>Smart POS</h1>
      <p style={{ 
        color: error ? '#e53e3e' : '#48bb78',
        fontSize: '18px'
      }}>
        {msg}
      </p>
      
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fff5f5',
          borderLeft: '4px solid #e53e3e',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
          <br />
          <small>Make sure the backend server is running on port 3001</small>
        </div>
      )}
    </div>
  );
}

export default App;
