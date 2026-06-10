import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Divider } from '@/components/ui/Divider';
import { NotificationSettings } from '@/components/settings/NotificationSettings';

const verificationColors: Record<string, string> = {
  VERIFIED: 'bg-primary-fixed/50 text-primary',
  PENDING: 'bg-yellow-500/20 text-yellow-600',
  REJECTED: 'bg-red-500/20 text-red-400',
};

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <span className="text-sm text-on-surface">{value ?? '—'}</span>
    </div>
  );
}

export function DriverProfile() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const updateVehicle = useAuthStore((s) => s.updateVehicle);
  const submitVerification = useAuthStore((s) => s.submitVerification);
  const updateUpiId = useAuthStore((s) => s.updateUpiId);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [vehicleType, setVehicleType] = useState(user?.driverProfile?.vehicleType ?? '');
  const [vehicleNumber, setVehicleNumber] = useState(user?.driverProfile?.vehicleNumber ?? '');
  const [licenseNumber, setLicenseNumber] = useState(user?.driverProfile?.licenseNumber ?? '');
  const [governmentIdNumber, setGovernmentIdNumber] = useState(
    user?.driverProfile?.governmentIdNumber ?? ''
  );
  const [upiId, setUpiId] = useState(user?.driverProfile?.upiId ?? '');
  const [savingUpi, setSavingUpi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  useEffect(() => {
    if (user?.driverProfile?.upiId) {
      setUpiId(user.driverProfile.upiId);
    }
  }, [user?.driverProfile?.upiId]);

  const profile = user?.driverProfile;
  const verificationStatus = profile?.verificationStatus ?? 'PENDING';
  const canSubmitVerification =
    verificationStatus !== 'VERIFIED' &&
    !(verificationStatus === 'PENDING' && profile?.verificationSubmittedAt);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, phone: phone || undefined });
      await updateVehicle({
        vehicleType: vehicleType || undefined,
        vehicleNumber: vehicleNumber || undefined,
      });
      addToast('success', 'Profile updated');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!licenseNumber.trim() || !governmentIdNumber.trim()) {
      addToast('error', 'License number and government ID are required');
      return;
    }
    setSubmittingVerification(true);
    try {
      await submitVerification({
        licenseNumber: licenseNumber.trim(),
        governmentIdNumber: governmentIdNumber.trim(),
      });
      addToast('success', 'Verification submitted for review');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to submit verification');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleSaveUpi = async () => {
    if (!upiId.trim()) return;
    setSavingUpi(true);
    try {
      await updateUpiId(upiId.trim());
      addToast('success', 'UPI ID saved');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to save UPI ID');
    } finally {
      setSavingUpi(false);
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
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-primary-fixed/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
            Driver
          </span>
          <span
            className={[
              'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest',
              verificationColors[verificationStatus] ?? verificationColors.PENDING,
            ].join(' ')}
          >
            {verificationStatus}
          </span>
        </div>
      </Card>

      {profile && (
        <Card noPadding>
          <div className="px-5 py-4">
            <p className="mb-2 text-[14px] font-semibold uppercase tracking-widest text-on-surface-variant">
              Vehicle Info
            </p>
            <InfoRow label="Type" value={profile.vehicleType} />
            <Divider />
            <InfoRow label="Number" value={profile.vehicleNumber} />
          </div>
        </Card>
      )}

      {profile && (
        <Card>
          <p className="mb-2 text-[14px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Driver Verification
          </p>
          {verificationStatus === 'VERIFIED' ? (
            <p className="text-sm text-on-surface-variant">
              Your account is verified. You can go online and accept rides.
            </p>
          ) : verificationStatus === 'PENDING' && profile.verificationSubmittedAt ? (
            <p className="text-sm text-on-surface-variant">
              Your documents are under review. You will be notified once an admin approves your
              account.
            </p>
          ) : (
            <>
              {verificationStatus === 'REJECTED' && profile.verificationRejectionReason && (
                <p className="mb-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  Rejected: {profile.verificationRejectionReason}
                </p>
              )}
              <p className="mb-4 text-sm text-on-surface-variant">
                Submit your license and government ID to get verified before going online.
              </p>
              <div className="space-y-3">
                <Input
                  label="Driver License Number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. DL-123456"
                />
                <Input
                  label="Government ID Number"
                  value={governmentIdNumber}
                  onChange={(e) => setGovernmentIdNumber(e.target.value)}
                  placeholder="Aadhaar or university ID"
                />
              </div>
              {canSubmitVerification && (
                <Button
                  className="mt-4 w-full"
                  onClick={handleSubmitVerification}
                  loading={submittingVerification}
                  disabled={submittingVerification}
                >
                  Submit for Verification
                </Button>
              )}
            </>
          )}
          {profile.licenseNumber && (
            <div className="mt-4 border-t border-glass-border pt-4">
              <InfoRow label="License number" value={profile.licenseNumber} />
              <Divider />
              <InfoRow label="Government ID" value={profile.governmentIdNumber} />
            </div>
          )}
        </Card>
      )}

      <Card>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
          Payment
        </p>
        <p className="mb-4 text-xs text-on-surface-variant">
          Your UPI ID lets passengers pay you directly via QR or UPI apps.
        </p>
        <Input
          label="UPI ID"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          placeholder="yourname@upi"
        />
        <Button
          className="mt-3 w-full"
          onClick={handleSaveUpi}
          loading={savingUpi}
          disabled={savingUpi || !upiId.trim()}
        >
          Save UPI ID
        </Button>
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
          <Input
            label="Vehicle Type"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
          />
          <Input
            label="Vehicle Number"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
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
