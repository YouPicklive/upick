import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, Profile } from '@/hooks/useProfile';
import { useUserEntitlements } from '@/hooks/useUserEntitlements';
import type { User, Session } from '@supabase/supabase-js';

interface AppContextValue {
  // Auth
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  signOut: () => Promise<{ error: any }>;

  // Profile
  profile: Profile | null;
  profileLoading: boolean;
  updateProfile: ReturnType<typeof useProfile>['updateProfile'];
  checkUsernameAvailable: ReturnType<typeof useProfile>['checkUsernameAvailable'];

  // Entitlements
  isPremium: boolean;
  isPlus: boolean;
  isPremiumTier: boolean;
  tier: string;
  unlimitedSpins: boolean;
  canSaveFortunes: boolean;
  spinsUsedToday: number;
  freeSpinLimitPerDay: number;
  ownedPacks: string[];
  subscriptionEnd: string | null;
  upgradeToPlus: () => Promise<any>;
  upgradeToPremium: () => Promise<any>;
  openCustomerPortal: () => Promise<any>;
  purchasePack: (packId: string) => Promise<any>;
  refreshSubscription: () => Promise<void>;
  entitlementsLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const profile = useProfile();
  const entitlements = useUserEntitlements();

  const value = useMemo<AppContextValue>(() => ({
    // Auth
    user: auth.user,
    session: auth.session,
    isAuthenticated: auth.isAuthenticated,
    authLoading: auth.loading,
    signOut: auth.signOut,

    // Profile
    profile: profile.profile,
    profileLoading: profile.loading,
    updateProfile: profile.updateProfile,
    checkUsernameAvailable: profile.checkUsernameAvailable,

    // Entitlements
    isPremium: entitlements.isPremium,
    isPlus: entitlements.isPlus,
    isPremiumTier: entitlements.isPremiumTier,
    tier: entitlements.tier,
    unlimitedSpins: entitlements.unlimitedSpins,
    canSaveFortunes: entitlements.canSaveFortunes,
    spinsUsedToday: entitlements.spinsUsedToday,
    freeSpinLimitPerDay: entitlements.freeSpinLimitPerDay,
    ownedPacks: entitlements.ownedPacks,
    subscriptionEnd: entitlements.subscriptionEnd,
    upgradeToPlus: entitlements.upgradeToPlus,
    upgradeToPremium: entitlements.upgradeToPremium,
    openCustomerPortal: entitlements.openCustomerPortal,
    purchasePack: entitlements.purchasePack,
    refreshSubscription: entitlements.refreshSubscription,
    entitlementsLoading: entitlements.loading,
  }), [auth, profile, entitlements]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
