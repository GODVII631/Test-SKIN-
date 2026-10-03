import React, { createContext, useContext, useState, useEffect } from 'react';
import { DiscordUser, DiscordNotificationSettings } from '../types';
import { supabase } from '../lib/supabase';
import { fetchMyProfile, subscribeToUser, saveNotificationSettings, signInWithDiscord, signOut } from '../lib/db';

interface AuthContextType {
  currentUser: DiscordUser | null;
  loading: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  signIn: () => Promise<void>;
  updateSettings: (settings: Partial<DiscordNotificationSettings>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // theme is a harmless UI preference; nothing security-related is kept in localStorage
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return (localStorage.getItem('skin_theme') as 'dark' | 'light') || 'dark'; } catch { return 'dark'; }
  });
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('skin_theme', theme); } catch {}
  }, [theme]);

  // session -> profile (role/quota always come from the database, never from the browser)
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const load = async (userId: string | null) => {
      unsubProfile?.(); unsubProfile = null;
      if (!userId) { setCurrentUser(null); setLoading(false); return; }
      try {
        setCurrentUser(await fetchMyProfile(userId));
      } catch (e) { console.warn('profile load failed', e); }
      setLoading(false);
      unsubProfile = subscribeToUser(userId, (p) => { if (p) setCurrentUser(p); });
    };

    supabase.auth.getSession().then(({ data }) => load(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      // defer to avoid deadlocks inside the auth callback
      setTimeout(() => load(session?.user.id ?? null), 0);
    });
    return () => { sub.subscription.unsubscribe(); unsubProfile?.(); };
  }, []);

  const updateSettings = async (settings: Partial<DiscordNotificationSettings>) => {
    if (!currentUser) return;
    await saveNotificationSettings(currentUser.id, settings);
    setCurrentUser((prev) => prev && { ...prev, notificationSettings: { ...prev.notificationSettings, ...settings } });
  };

  return (
    <AuthContext.Provider value={{
      currentUser, loading, theme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      signIn: signInWithDiscord,
      updateSettings,
      logout: () => { signOut(); setCurrentUser(null); },
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
