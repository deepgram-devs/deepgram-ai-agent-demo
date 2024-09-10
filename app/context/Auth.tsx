"use client";
import { Spinner } from "@nextui-org/react";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "react-toastify";

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  handleLogin: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const verifyToken = async (token: string) => {
  try {
    const res = await fetch("/api/verify-token", {
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    return res.json();
  } catch (err) {
    return null;
  }
};

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  const login = (newToken: string) => {
    localStorage.setItem("jwtToken", newToken);
    setToken(newToken);
  };

  const handleLogin = async () => {
    // API route that generates the JWT token
    const response = await fetch("/api/generate-token", {
      method: "POST",
    });
    const data = await response.json();
    login(data.token);
  };

  const logout = () => {
    localStorage.removeItem("jwtToken");
    setToken(null);
  };

  useEffect(() => {
    // Load token from localStorage when the app initializes
    const loadToken = () => {
      setLoading(true);
      try {
        const savedToken = localStorage.getItem("jwtToken");
        // saved token verification
        if (savedToken) {
          // const isValid = verifyToken(savedToken);
          // if(!isValid) {
          //   logout();
          //   return;
          // };
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
  }, []);

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
