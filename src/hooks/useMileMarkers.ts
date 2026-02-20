import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserEntitlements } from './useUserEntitlements';
import { toast } from 'sonner';

export interface MileMarkerTransaction {
  id: string;
  user_id: string;
  type: 'earn' | 'redeem';
  points: number;
  reason: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  reward_type: string;
  quantity_available: number;
  active: boolean;
  expires_at: string | null;
}

export function useMileMarkers() {
  const { user, isAuthenticated } = useAuth();
  const { isPlus } = useUserEntitlements();

  const [balance, setBalance] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [transactions, setTransactions] = useState<MileMarkerTransaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user || !isPlus) return;

    setLoading(true);
    try {
      const [markersRes, txRes, rewardsRes] = await Promise.all([
        supabase
          .from('mile_markers' as any)
          .select('points_balance, lifetime_points')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('mile_marker_transactions' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('rewards' as any)
          .select('*')
          .eq('active', true)
          .order('points_cost'),
      ]);

      if (markersRes.data) {
        setBalance((markersRes.data as any).points_balance ?? 0);
        setLifetimePoints((markersRes.data as any).lifetime_points ?? 0);
      }
      setTransactions(((txRes.data as any[]) || []) as MileMarkerTransaction[]);
      setRewards(((rewardsRes.data as any[]) || []) as Reward[]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, isPlus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const awardPoints = useCallback(async (reason: string, points: number, metadata?: Record<string, unknown>) => {
    if (!isAuthenticated || !user || !isPlus) return;
    try {
      const { data } = await supabase.rpc('award_mile_markers' as any, {
        p_user_id: user.id,
        p_reason: reason,
        p_points: points,
        p_metadata: metadata ?? {},
      });
      if (data && (data as any).awarded) {
        const newBalance = (data as any).new_balance as number;
        setBalance(newBalance);
        const given = (data as any).points_given as number;
        toast(`+${given} Mile Marker${given !== 1 ? 's' : ''} 🏁`, { duration: 2500 });
      }
    } catch {
      // Silently fail — points are a nice-to-have
    }
  }, [isAuthenticated, user?.id, isPlus]);

  const redeemReward = useCallback(async (rewardId: string): Promise<{ success: boolean; code?: string; reason?: string }> => {
    if (!isAuthenticated || !user) return { success: false, reason: 'not_authenticated' };
    const requestId = crypto.randomUUID();
    try {
      const { data, error } = await supabase.rpc('redeem_mile_marker_reward' as any, {
        p_user_id: user.id,
        p_reward_id: rewardId,
        p_request_id: requestId,
      });
      if (error) return { success: false, reason: error.message };
      const result = data as any;
      if (result?.success) {
        toast.success(`Reward redeemed! 🎉 Code: ${result.code}`, { duration: 8000 });
        fetchData();
        return { success: true, code: result.code };
      }
      return { success: false, reason: result?.reason };
    } catch (err: any) {
      return { success: false, reason: err.message };
    }
  }, [isAuthenticated, user?.id, fetchData]);

  return {
    balance,
    lifetimePoints,
    transactions,
    rewards,
    isPlus,
    loading,
    awardPoints,
    redeemReward,
    refetch: fetchData,
  };
}
