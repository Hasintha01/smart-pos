import '../styles/Loading.css';

/**
 * Loading Component
 * Consistent loading state UI across all pages
 * 
 * @param {string} message - Optional loading message (default: "Loading...")
 */
function Loading({ message = "Loading..." }) {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

export default Loading;
