import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import appIcon from '@/assets/app-icon.png';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setError(error.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    setError(null);
    const { error } = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setError(error.message || 'Failed to sign in with Apple');
      setAppleLoading(false);
    }
  };

  const validateInputs = () => {
    setError(null);
    const emailResult = emailSchema.safeParse(email.trim());
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return false;
    }
    if (mode !== 'forgot') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        setError(passwordResult.error.errors[0].message);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please confirm your email before signing in.');
          } else {
            setError(error.message);
          }
        } else {
          navigate('/');
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email.trim(), password);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Please sign in.');
          } else {
            setError(error.message);
          }
        } else {
          setSuccess('Check your email to confirm your account!');
          setMode('login');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email.trim());
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Password reset email sent!');
        }
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome back';
      case 'signup': return 'Create account';
      case 'forgot': return 'Reset password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Sign in to access your saved picks';
      case 'signup': return 'Join to save your preferences';
      case 'forgot': return "We'll send you a reset link";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary overflow-hidden mx-auto mb-4">
            <img src={appIcon} alt="You Pick" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-1">{getTitle()}</h1>
          <p className="text-muted-foreground text-sm">{getSubtitle()}</p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/5 border border-destructive/20 text-destructive rounded-xl p-3 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-success/5 border border-success/20 text-success rounded-xl p-3 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl"
                  disabled={loading}
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 rounded-xl"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </Button>
          </form>

          {mode !== 'forgot' && (
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-card px-3 text-muted-foreground">or continue with</span>
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="space-y-2.5">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || appleLoading || loading}
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="apple"
                size="lg"
                className="w-full"
                onClick={handleAppleSignIn}
                disabled={appleLoading || googleLoading || loading}
              >
                {appleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continue with Apple
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="mt-5 text-center text-sm">
            {mode === 'login' ? (
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <button onClick={() => { setMode('signup'); setError(null); setSuccess(null); }} className="text-primary font-medium hover:underline">
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(null); setSuccess(null); }} className="text-primary font-medium hover:underline">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}