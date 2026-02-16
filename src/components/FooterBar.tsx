import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface FooterBarProps {
  onSpin?: () => void;
}

export function FooterBar({ onSpin }: FooterBarProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { profile } = useProfile();

  const avatarUrl = profile?.avatar_url;
  const profilePath = isAuthenticated
    ? profile?.username
      ? `/u/${profile.username}`
      : '/settings'
    : '/auth';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="bg-card/90 backdrop-blur-md border-t border-border/50 px-6 py-3 flex items-center justify-between max-w-lg mx-auto">
        {/* Spin button */}
        <button
          onClick={onSpin}
          className="flex-1 mr-4 py-3 rounded-full font-display font-bold text-sm tracking-wide text-primary-foreground transition-all active:scale-95"
          style={{ background: 'var(--gradient-warm)' }}
        >
          Spin
        </button>

        {/* Profile icon */}
        <button
          onClick={() => navigate(profilePath)}
          className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border/50 shrink-0 hover:ring-2 hover:ring-primary/30 transition-all active:scale-95"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
