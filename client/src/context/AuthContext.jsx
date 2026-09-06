import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user?.language_preference) {
            i18n.changeLanguage(data.user.language_preference);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Session check failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (loginIdentifier, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginIdentifier, password }),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    setUser(data.user);
    if (data.user?.language_preference) {
      i18n.changeLanguage(data.user.language_preference);
    }
    return data.user;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
    }
  };

  const updateLanguage = async (newLang) => {
    i18n.changeLanguage(newLang);
    if (user) {
      setUser({ ...user, language_preference: newLang });
      try {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language_preference: newLang }),
          credentials: 'include',
        });
      } catch (e) {
        console.error('Failed to persist language preference', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateLanguage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
