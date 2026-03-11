import React, { useEffect, useState } from "react";
import { AuthContext } from "./auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage and listen for changes
  useEffect(() => {
    const updateAuth = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      try {
        setToken(
          storedToken && storedToken !== "null" && storedToken !== "undefined"
            ? storedToken
            : null,
        );
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch {
        setToken(null);
        setUser(null);
      }

      setLoading(false);
    };

    updateAuth();

    // Listen for storage changes (e.g., from other tabs, or programmatic updates)
    window.addEventListener("storage", updateAuth);

    // Custom event for same-tab updates (when we do localStorage.setItem in same tab)
    const handleAuthChange = () => updateAuth();
    window.addEventListener("authChanged", handleAuthChange);

    return () => {
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
