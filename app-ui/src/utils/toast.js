import toast from 'react-hot-toast';

/**
 * Toast notification utilities
 * Wrapper around react-hot-toast for consistent styling and behavior
 */

const defaultOptions = {
  duration: 3000,
  position: 'top-right',
  style: {
    background: '#333',
    color: '#fff',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
  },
};

export const showSuccess = (message) => {
  toast.success(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#2ecc71',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#2ecc71',
    },
  });
};

export const showError = (message) => {
  toast.error(message, {
    ...defaultOptions,
    duration: 4000, // Errors stay longer
    style: {
      ...defaultOptions.style,
      background: '#e74c3c',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#e74c3c',
    },
  });
};

export const showInfo = (message) => {
  toast(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#3498db',
    },
    icon: 'i',
  });
};

export const showWarning = (message) => {
  toast(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#f39c12',
    },
    icon: '!',
  });
};

export const showLoading = (message) => {
  return toast.loading(message, {
    ...defaultOptions,
    duration: Infinity, // Loading stays until dismissed
    style: {
      ...defaultOptions.style,
      background: '#95a5a6',
    },
  });
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const dismissAllToasts = () => {
  toast.dismiss();
};

// Export the toast instance for advanced usage
export { toast };
