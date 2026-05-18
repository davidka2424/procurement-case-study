import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On boot, check whether the existing invoice_token cookie still
  // points at a finance user. If not we land back on the login page.
  useEffect(() => {
    api
      .get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const r = await api.post('/auth/login', { username, password });
    setUser(r.data);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // even if the backend rejects, clear local state
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
