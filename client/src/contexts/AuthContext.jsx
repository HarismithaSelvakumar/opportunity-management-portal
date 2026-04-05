import React, { useEffect, useState } from "react";
import { AuthContext } from "./auth";

/* Provider component */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

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

    /* Listen for cross-tab changes */
    window.addEventListener("storage", updateAuth);

    /* Listen for same-tab manual updates */
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
