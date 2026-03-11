export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const env = import.meta.env as ImportMetaEnv;
  const envUrl = env.VITE_API_URL || 'http://localhost:3001/api';
  const baseUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      console.warn('Sessão expirada ou inválida');
      localStorage.removeItem('auth_token');
      if (!window.location.pathname.includes('/auth')) {
         window.location.href = '/auth'; 
      }
    }

    if (response.status === 204) return null;

    const data = await response.json().catch(() => ({} as { error?: string; message?: string }));

    if (!response.ok) {
      throw new Error(data.error || data.message || `Erro API: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`Erro na requisição para ${endpoint}:`, error);
    throw error;
  }
};
