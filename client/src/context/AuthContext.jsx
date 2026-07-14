import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchMe, loginUser, registerUser, updateProfile } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("svp_token");
    if (!token) {
      setInitializing(false);
      return;
    }
    fetchMe()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem("svp_token"))
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password });
    localStorage.setItem("svp_token", data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // Checks credentials without starting a session yet — used by the OTP login flow,
  // which only persists the session once every step succeeds.
  const verifyCredentials = useCallback(async (email, password) => {
    return loginUser({ email, password });
  }, []);

  const finalizeSession = useCallback((token, sessionUser) => {
    localStorage.setItem("svp_token", token);
    setUser(sessionUser);
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    localStorage.setItem("svp_token", data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("svp_token");
    setUser(null);
  }, []);

  const updateUser = useCallback(async (payload) => {
    const data = await updateProfile(payload);
    setUser(data.user);
    return data.user;
  }, []);

  // Lets flows that hit their own endpoints (e.g. PIN setup) sync the resulting
  // user object back into context without re-fetching /me.
  const syncUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        login,
        verifyCredentials,
        finalizeSession,
        register,
        logout,
        updateUser,
        syncUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
