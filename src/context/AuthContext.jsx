import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';
import { AuthContext } from './AuthContextObject';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    const initAuth = async () => {
      setLoading(true);
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          const { data: userProfile } = await authService.getProfile(currentUser.id);
          setProfile(userProfile);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          const { data: userProfile } = await authService.getProfile(currentUser.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await authService.signIn(email, password);
    if (!error && data?.user) {
      setUser(data.user);
      const { data: userProfile } = await authService.getProfile(data.user.id);
      setProfile(userProfile);
    }
    setLoading(false);
    return { data, error };
  };

  const register = async (email, password, metadata) => {
    setLoading(true);
    const { data, error } = await authService.signUp(email, password, metadata);
    if (!error && data?.user) {
      setUser(data.user);
      const { data: userProfile } = await authService.getProfile(data.user.id);
      setProfile(userProfile);
    }
    setLoading(false);
    return { data, error };
  };

  const logout = async () => {
    setLoading(true);
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        role: profile?.role || user?.role || 'CASHIER'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
