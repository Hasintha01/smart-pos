// Utility to add auth headers
export function getAuthHeaders(includeContentType = true) {
  const token = localStorage.getItem('token');
  const headers = {
    'Authorization': token ? `Bearer ${token}` : ''
  };
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
}

// Wrapper for authenticated fetch
export async function authFetch(url, options = {}) {
  // Only include Content-Type for methods that typically have a body
  const includeContentType = options.method !== 'DELETE' && options.method !== 'GET';
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(includeContentType),
      ...options.headers
    }
  });

  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return response;
}
