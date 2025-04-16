import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Auth provider Token:", token);
        if (token) {
          const response = await api.get("/api/users/me");
          console.log("Auth check response:", response);
          if (response.status === 401 || response.status === 404) {
            logout();
          }
          setUser(response.data.data.user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        console.log("Error response:", error.response);
        if (error.response?.status === 401 || error.response?.status === 404) {
          logout();
        }
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post("/api/users/login", credentials);

      // Check for error in response body
      if (response.data.error) {
        throw new Error(response.data.error);
        console.log("Login error:", response.data.error);
      }

      localStorage.setItem("token", response.data.token);
      setUser(response.data.data.user);
      return { ...response.data, user: response.data.data.user };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
