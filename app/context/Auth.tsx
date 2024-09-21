"use client";
import { Spinner } from "@nextui-org/react";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import cookie from "js-cookie";

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  handleLogin: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  const login = (newToken: string) => {
    cookie.set("dipjwtToken", newToken, { expires: 4 / 24 });
    setToken(newToken);
  };

  const handleLogin = useCallback(async () => {
    // API route that generates the JWT token
    const response = await fetch("/api/generate-token", {
      method: "POST",
    });
    const data = await response.json();
    login(data.token);
  }, []);

  const logout = () => {
    cookie.remove("dipjwtToken");
    setToken(null);
  };

  useEffect(() => {
    // Load token from cookies when the app initializes
    const loadToken = () => {
      setLoading(true);
      try {
        const savedToken = cookie.get("dipjwtToken");
        // saved token verification
        if (savedToken) {
          setToken(savedToken);
        } else {
          handleLogin();
        }
      } catch (err: any) {
        logout();
        toast.error(err?.message);
      }
      setLoading(false);
    };
    loadToken();
  }, [handleLogin]);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{ token, login, logout, handleLogin, isAuthenticated }}
    >
      {isLoading ? <Spinner /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
