import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "taskflow_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Restore session on refresh
  useEffect(() => {
    if (!token) return;
    api("/auth/me", { token })
      .then((data) => setUser(data.user))
      .catch(logout)
      .finally(() => setLoading(false));
  }, [token, logout]);

  const authenticate = async (mode, form) => {
    const data = await api(`/auth/${mode}`, { method: "POST", body: form });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
