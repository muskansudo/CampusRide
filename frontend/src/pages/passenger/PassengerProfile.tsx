import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Divider } from '@/components/ui/Divider';
import { NotificationSettings } from '@/components/settings/NotificationSettings';

export function PassengerProfile() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, phone: phone || undefined });
      addToast('success', 'Profile updated');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-5">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
          Account
        </p>
        <h2 className="font-display text-3xl text-on-surface">Profile</h2>
      </div>

      <Card variant="deep" className="flex flex-col items-center py-8">
        <UserAvatar name={user?.name ?? ''} size="lg" />
        <p className="mt-4 font-display text-2xl text-on-surface">{user?.name}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{user?.email}</p>
        <span className="mt-3 rounded-full bg-secondary-container/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-on-secondary-container">
          Passenger
        </span>
      </Card>

      <Card>
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
          Edit Details
        </p>
        <div className="space-y-3">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <Button
          className="mt-4 w-full"
          onClick={handleSave}
          loading={saving}
          disabled={saving}
        >
          Save Changes
        </Button>
      </Card>

      <NotificationSettings />

      <Card noPadding>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-red-400 transition hover:bg-white/10 rounded-[inherit]"
        >
          Sign Out
          <span className="text-xs">→</span>
        </button>
      </Card>

      <Divider />
      <p className="text-center text-[10px] text-on-surface-variant/50">
        {user?.email}
      </p>
    </div>
  );
}
