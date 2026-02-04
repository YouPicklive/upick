import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
            setError('Invalid email or password. Please try again.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please check your email to confirm your account before signing in.');
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
            setError('This email is already registered. Please sign in instead.');
          } else {
            setError(error.message);
          }
        } else {
          setSuccess('Check your email to confirm your account! You can then sign in.');
          setMode('login');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email.trim());
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Password reset email sent! Check your inbox.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back!';
      case 'signup': return 'Create Account';
      case 'forgot': return 'Reset Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Sign in to access your saved picks';
      case 'signup': return 'Join to save your entitlements';
      case 'forgot': return "We'll send you a reset link";
    }
  };

  return (
    <div className="min-h-screen gradient-sunset flex flex-col items-center justify-center px-6 py-12">
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-20 left-10 text-4xl animate-float opacity-50">🔐</span>
        <span className="absolute top-40 right-16 text-3xl animate-float opacity-50" style={{ animationDelay: '0.5s' }}>✨</span>
        <span className="absolute bottom-32 left-20 text-4xl animate-float opacity-50" style={{ animationDelay: '1s' }}>🥢</span>
      </div>

      <div className="w-full max-w-sm animate-slide-up relative z-10">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <span className="text-6xl">{mode === 'forgot' ? '📧' : '🥢'}</span>
          </div>
          <h1 className="text-3xl font-extrabold mb-2">{getTitle()}</h1>
          <p className="text-muted-foreground">{getSubtitle()}</p>
        </div>

        {/* Form Card */}
        <div className="gradient-card rounded-3xl p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-success/10 border border-success/30 text-success rounded-xl p-3 text-sm">
                {success}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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

            {/* Password Input (not for forgot mode) */}
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link (login mode only) */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                'Sign In'
              ) : mode === 'signup' ? (
                'Create Account'
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 text-center text-sm">
            {mode === 'login' ? (
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                  className="text-primary font-semibold hover:underline"
                >
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
