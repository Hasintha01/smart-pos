import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import '../styles/KeyboardShortcuts.css';

/**
 * Keyboard Shortcuts Help Modal
 * Displays all available keyboard shortcuts
 * Triggered by F1 key
 */
function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // F1 to open shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'General',
      items: [
        { key: 'F1', description: 'Show this help dialog' },
        { key: 'Esc', description: 'Close dialogs / Cancel actions' },
        { key: 'Ctrl + /', description: 'Focus search (where available)' },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { key: 'Alt + D', description: 'Go to Dashboard' },
        { key: 'Alt + P', description: 'Go to POS Screen' },
        { key: 'Alt + R', description: 'Go to Products' },
        { key: 'Alt + C', description: 'Go to Categories' },
        { key: 'Alt + I', description: 'Go to Inventory' },
        { key: 'Alt + S', description: 'Go to Settings' },
      ]
    },
    {
      category: 'POS Screen',
      items: [
        { key: 'F2', description: 'Clear cart / New sale' },
        { key: 'F3', description: 'Focus product search' },
        { key: 'F4', description: 'Open payment modal' },
        { key: 'Enter', description: 'Complete sale (in payment modal)' },
        { key: '↑ / ↓', description: 'Navigate cart items' },
        { key: 'Del', description: 'Remove selected item from cart' },
        { key: '+ / -', description: 'Increase/Decrease quantity' },
      ]
    },
    {
      category: 'Products & Inventory',
      items: [
        { key: 'Ctrl + N', description: 'Add new product' },
        { key: 'Ctrl + E', description: 'Edit selected product' },
        { key: 'Ctrl + S', description: 'Save product/form' },
        { key: 'Ctrl + F', description: 'Focus search' },
      ]
    },
    {
      category: 'Forms & Modals',
      items: [
        { key: 'Enter', description: 'Submit form / Confirm' },
        { key: 'Esc', description: 'Cancel / Close modal' },
        { key: 'Tab', description: 'Navigate between fields' },
        { key: 'Shift + Tab', description: 'Navigate backwards' },
      ]
    }
  ];

  return (
    <div className="keyboard-shortcuts-overlay" onClick={() => setIsOpen(false)}>
      <div className="keyboard-shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <div className="shortcuts-title">
            <Keyboard size={24} />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button 
            className="close-button" 
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="shortcuts-content">
          {shortcuts.map((section, index) => (
            <div key={index} className="shortcuts-section">
              <h3 className="section-title">{section.category}</h3>
              <div className="shortcuts-list">
                {section.items.map((item, idx) => (
                  <div key={idx} className="shortcut-item">
                    <kbd className="shortcut-key">{item.key}</kbd>
                    <span className="shortcut-description">{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <p>Press <kbd>F1</kbd> anytime to show this dialog</p>
          <button 
            className="print-button" 
            onClick={() => window.print()}
          >
            Print Shortcuts
          </button>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcuts;
