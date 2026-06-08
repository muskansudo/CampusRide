import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Lock, Mail, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { AuthPageLayout } from '@/components/layout/AuthPageLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roleView, setRoleView] = useState<'passenger' | 'driver'>('passenger');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      navigate(user?.role === 'DRIVER' ? '/driver' : '/passenger');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="auth-glass w-full max-w-[400px] p-8 page-enter">
        <div className="auth-tab-track mb-8 flex">
          <span className="flex flex-1 items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold uppercase tracking-wide text-on-primary">
            Login
          </span>
          <Link
            to="/register"
            className="flex flex-1 items-center justify-center rounded-full py-3 text-sm font-semibold uppercase tracking-wide text-primary transition hover:opacity-80"
          >
            Register
          </Link>
        </div>

        <h2 className="font-display text-3xl text-primary">Welcome Back</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Sign in to continue your journey.</p>

        <div className="my-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRoleView('passenger')}
            className={[
              'flex flex-col items-center gap-2 rounded-2xl p-5 transition',
              roleView === 'passenger' ? 'auth-role-selected' : 'bg-transparent',
            ].join(' ')}
          >
            <User className="h-7 w-7 text-primary" strokeWidth={1.5} />
            <span className="text-sm font-medium text-primary">Passenger</span>
          </button>
          <button
            type="button"
            onClick={() => setRoleView('driver')}
            className={[
              'flex flex-col items-center gap-2 rounded-2xl p-5 transition',
              roleView === 'driver' ? 'auth-role-selected' : 'bg-transparent',
            ].join(' ')}
          >
            <Car className="h-7 w-7 text-primary" strokeWidth={1.5} />
            <span className="text-sm font-medium text-primary">Driver</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            variant="auth"
            label="University Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@university.edu"
            autoComplete="email"
            icon={<Mail className="h-5 w-5" />}
          />

          <div>
            <Input
              variant="auth"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              icon={<Lock className="h-5 w-5" />}
            />
            <div className="mt-2 flex justify-end px-1">
              <button
                type="button"
                className="text-xs font-medium text-primary/80 transition hover:text-primary"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {error && <p className="text-center text-xs text-error">{error}</p>}

          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full !shadow-none">
            Sign In
          </Button>
        </form>
      </div>
    </AuthPageLayout>
  );
}
