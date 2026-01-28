import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * Delays updating the debounced value until after the specified delay
 * Useful for search inputs, API calls, and other expensive operations
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {any} - The debounced value
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 * 
 * useEffect(() => {
 *   // This will only run 300ms after user stops typing
 *   if (debouncedQuery) {
 *     fetchSearchResults(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 */
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout to update debounced value
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay expires
    // or if component unmounts
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
