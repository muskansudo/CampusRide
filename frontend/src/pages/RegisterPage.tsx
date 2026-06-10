import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Lock, Mail, Phone, User } from 'lucide-react';
import type { Role } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { AuthPageLayout } from '@/components/layout/AuthPageLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function RegisterPage() {
  const [role, setRole] = useState<Role>('PASSENGER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('E-Rickshaw');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const isFormComplete = () => {
    const baseFilled =
      name.trim() !== '' &&
      email.trim() !== '' &&
      phone.trim() !== '' &&
      password.trim() !== '';

    if (role === 'DRIVER') {
      return baseFilled && vehicleType.trim() !== '' && vehicleNumber.trim() !== '';
    }

    return baseFilled;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isFormComplete()) {
      setError('All fields are compulsory.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        ...(role === 'DRIVER' && {
          vehicleType: vehicleType.trim(),
          vehicleNumber: vehicleNumber.trim(),
        }),
      });
      navigate(role === 'DRIVER' ? '/driver' : '/passenger');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="auth-glass w-full max-w-[400px] p-8 page-enter">
        <div className="auth-tab-track mb-8 flex">
          <Link
            to="/login"
            className="flex flex-1 items-center justify-center rounded-full py-3 text-sm font-semibold uppercase tracking-wide text-primary transition hover:opacity-80"
          >
            Login
          </Link>
          <span className="flex flex-1 items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold uppercase tracking-wide text-on-primary">
            Register
          </span>
        </div>

        <h2 className="font-display text-3xl text-primary">Create Account</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Join as a passenger or driver.</p>

        <div className="my-6 grid grid-cols-2 gap-3">
          {(['PASSENGER', 'DRIVER'] as Role[]).map((r) => {
            const active = role === r;
            const Icon = r === 'PASSENGER' ? User : Car;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={[
                  'flex flex-col items-center gap-2 rounded-2xl p-5 transition',
                  active ? 'auth-role-selected' : 'bg-transparent',
                ].join(' ')}
              >
                <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-medium text-primary">
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            variant="auth"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User className="h-5 w-5" />}
          />
          <Input
            variant="auth"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            icon={<Mail className="h-5 w-5" />}
          />
          <Input
            variant="auth"
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<Phone className="h-5 w-5" />}
          />
          <Input
            variant="auth"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            icon={<Lock className="h-5 w-5" />}
          />
          {role === 'DRIVER' && (
            <>
              <Input
                variant="auth"
                label="Vehicle Type"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                icon={<Car className="h-5 w-5" />}
              />
              <Input
                variant="auth"
                label="Vehicle Number"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </>
          )}

          {error && <p className="text-center text-xs text-error">{error}</p>}

          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full !shadow-none">
            Create Account
          </Button>
        </form>
      </div>
    </AuthPageLayout>
  );
}
