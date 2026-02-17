import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Bookmark, Star, Rss, Calendar, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import appIcon from '@/assets/app-icon.png';

export function GlobalHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || '';
  const avatarUrl = profile?.avatar_url;
  const profilePath = profile?.username ? `/u/${profile.username}` : '/settings';

  const menuItems = [
    { label: 'Profile', icon: User, path: profilePath },
    { label: 'Feed', icon: Rss, path: '/feed' },
    { label: 'Events Today', icon: Calendar, path: '/events-today' },
    { label: 'Saved Fortunes', icon: Bookmark, path: '/saved' },
    { label: 'Membership', icon: Star, path: '/membership' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const navIcons = [
    { icon: Rss, path: '/feed', label: 'Feed' },
    { icon: Calendar, path: '/events-today', label: 'Events' },
  ];

  return (
    <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      {/* Logo */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-xl bg-primary overflow-hidden">
          <img src={appIcon} alt="You Pick" className="w-full h-full object-cover" />
        </div>
        <span className="font-display font-bold text-base tracking-tight">You Pick</span>
      </button>

      {/* Right side: nav icons + profile */}
      <div className="flex items-center gap-1">
        {/* Feed & Events icons — always visible */}
        {navIcons.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              location.pathname === item.path
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
            aria-label={item.label}
          >
            <item.icon className="w-[18px] h-[18px]" />
          </button>
        ))}

        {/* Profile / Sign In */}
        {loading ? (
          <div className="w-9 h-9" />
        ) : isAuthenticated ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen(prev => !prev)}
              className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border border-border/50 hover:ring-2 hover:ring-primary/30 transition-all ml-0.5"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-[18px] h-[18px] text-muted-foreground" />
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-card-hover py-1.5 animate-fade-up">
                <div className="px-4 py-2.5 border-b border-border/50">
                  <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>

                {menuItems.map(item => (
                  <button
                    key={item.path + item.label}
                    onClick={() => { setOpen(false); navigate(item.path); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/60 transition-colors ${
                      location.pathname === item.path ? 'text-primary font-medium' : 'text-foreground'
                    }`}
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    {item.label}
                  </button>
                ))}

                <div className="border-t border-border/50 mt-1 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-0.5"
            aria-label="Sign In"
          >
            <User className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    </header>
  );
}
