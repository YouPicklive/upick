import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Save, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { GlobalHeader } from '@/components/GlobalHeader';
import { AvatarPicker } from '@/components/AvatarPicker';
import { toast } from 'sonner';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export default function Settings() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, loading, updateProfile, checkUsernameAvailable } = useProfile();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch email from auth user, not profiles table
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
      setBio(profile.bio || '');
      setCity(profile.city || '');
      setRegion(profile.region || '');
      setPrivacy(profile.default_post_privacy || 'public');
      setUsernameValid(true);
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Debounced username validation
  useEffect(() => {
    if (!username || username === profile?.username) {
      setUsernameError(null);
      setUsernameValid(!!username);
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      setUsernameError('3–20 chars, lowercase letters, numbers, underscore only');
      setUsernameValid(false);
      return;
    }

    setUsernameChecking(true);
    const timeout = setTimeout(async () => {
      const available = await checkUsernameAvailable(username);
      setUsernameChecking(false);
      if (!available) {
        setUsernameError('Username is taken');
        setUsernameValid(false);
      } else {
        setUsernameError(null);
        setUsernameValid(true);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [username, profile?.username, checkUsernameAvailable]);

  const handleSave = async () => {
    if (!usernameValid) {
      toast.error('Please fix username errors first');
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      display_name: displayName || null,
      username: username || null,
      avatar_url: avatarUrl || null,
      bio: bio || null,
      city: city || null,
      region: region || null,
      default_post_privacy: privacy,
    });
    setSaving(false);

    if (result.error) {
      if (result.error.includes('profiles_username_key')) {
        toast.error('Username is taken, please try another');
      } else {
        toast.error('Failed to update profile', { description: result.error });
      }
    } else {
      toast.success('Profile updated!');
      navigate(`/u/${username}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      <main className="max-w-md mx-auto px-6 py-8">
        <h1 className="font-display text-xl font-bold mb-6">Settings</h1>

        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-3 overflow-hidden border-2 border-border/50">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">{userEmail}</p>
          <AvatarPicker selected={avatarUrl} onSelect={setAvatarUrl} />
        </div>

        <div className="space-y-5">
          <div>
            <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we greet you?"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="username" className="text-sm font-medium">Username</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                className="pl-8 pr-10"
                maxLength={20}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameChecking ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : usernameValid && username ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : usernameError ? (
                  <X className="w-4 h-4 text-destructive" />
                ) : null}
              </div>
            </div>
            {usernameError && (
              <p className="text-xs text-destructive mt-1">{usernameError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about you..."
              className="mt-1.5 resize-none"
              rows={3}
              maxLength={160}
            />
            <p className="text-[11px] text-muted-foreground text-right mt-0.5">{bio.length}/160</p>
          </div>

          {/* Avatar URL field removed — users pick from preset avatars above */}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city" className="text-sm font-medium">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Richmond"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="region" className="text-sm font-medium">State</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="VA"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Feed Privacy</Label>
            <div className="flex gap-2 mt-1.5">
              {(['public', 'anonymous', 'private'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setPrivacy(opt)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    privacy === opt
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {privacy === 'public' && 'Your spins appear on the feed with your name'}
              {privacy === 'anonymous' && 'Your spins appear on the feed anonymously'}
              {privacy === 'private' && 'Your spins are not posted to the feed'}
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving || !usernameValid} className="w-full" size="lg">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </main>
    </div>
  );
}
