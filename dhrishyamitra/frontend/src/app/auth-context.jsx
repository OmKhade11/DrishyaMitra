import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, getInitialUser, loginUser, logoutUser, registerUser } from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const me = await fetchCurrentUser();
        setUser(me);
      } catch {
        logoutUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    sync();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      async login(payload) {
        const nextUser = await loginUser(payload);
        setUser(nextUser);
        return nextUser;
      },
      async register(payload) {
        const nextUser = await registerUser(payload);
        setUser(nextUser);
        return nextUser;
      },
      logout() {
        logoutUser();
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
