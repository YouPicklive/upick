import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

/**
 * /profile → redirects to /u/:username (logged in) or /auth (logged out)
 */
export default function Profile() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }
    if (profile?.username) {
      navigate(`/u/${profile.username}`, { replace: true });
    } else {
      navigate('/settings', { replace: true });
    }
  }, [authLoading, profileLoading, isAuthenticated, profile?.username, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}
