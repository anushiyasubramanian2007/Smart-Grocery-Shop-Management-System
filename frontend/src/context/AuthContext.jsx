import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('smart_grocery_token') || null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (token) {
        try {
          const res = await authAPI.getProfile();
          if (res.data && res.data.owner) {
            setOwner(res.data.owner);
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem('smart_grocery_token');
          setToken(null);
          setOwner(null);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [token]);

  const login = async (username, password) => {
    const res = await authAPI.login(username, password);
    if (res.data && res.data.token) {
      localStorage.setItem('smart_grocery_token', res.data.token);
      setToken(res.data.token);
      setOwner(res.data.owner);
      return res.data;
    }
    throw new Error('Login failed');
  };

  const loginWithGoogle = async (googleData) => {
    const res = await authAPI.googleLogin(googleData);
    if (res.data && res.data.token) {
      localStorage.setItem('smart_grocery_token', res.data.token);
      setToken(res.data.token);
      setOwner(res.data.owner);
      return res.data;
    }
    throw new Error('Google authentication failed');
  };

  const sendGoogleVerificationCode = async (email) => {
    const res = await authAPI.sendGoogleCode(email);
    return res.data;
  };

  const verifyGoogleEmail = async (email, code, name) => {
    const res = await authAPI.verifyGoogleCode({ email, code, name });
    if (res.data && res.data.token) {
      localStorage.setItem('smart_grocery_token', res.data.token);
      setToken(res.data.token);
      setOwner(res.data.owner);
      return res.data;
    }
    throw new Error('Google verification failed');
  };

  const logout = () => {
    localStorage.removeItem('smart_grocery_token');
    setToken(null);
    setOwner(null);
  };

  const updateOwnerState = (newOwner) => {
    setOwner(newOwner);
  };

  return (
    <AuthContext.Provider value={{
      token,
      owner,
      login,
      loginWithGoogle,
      sendGoogleVerificationCode,
      verifyGoogleEmail,
      logout,
      updateOwnerState,
      isAuthenticated: !!token,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
