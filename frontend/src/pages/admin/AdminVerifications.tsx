import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import type { PendingVerification } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { Input } from '@/components/ui/Input';

function formatSubmittedAt(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function AdminVerifications() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [pending, setPending] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const loadPending = useCallback(async () => {
    const data = await api.getPendingVerifications();
    setPending(data);
  }, []);

  useEffect(() => {
    loadPending()
      .catch((err) => addToast('error', err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [loadPending, addToast]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPending();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handleReview = async (driverUserId: string, status: 'VERIFIED' | 'REJECTED') => {
    setActionUserId(driverUserId);
    try {
      await api.reviewVerification(driverUserId, {
        status,
        rejectionReason:
          status === 'REJECTED' ? rejectionReasons[driverUserId] || undefined : undefined,
      });
      addToast('success', status === 'VERIFIED' ? 'Driver approved' : 'Driver rejected');
      await loadPending();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Review failed');
    } finally {
      setActionUserId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="mx-auto min-h-screen max-w-[600px] px-5 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            Admin
          </p>
          <h1 className="font-display text-3xl text-on-surface">Driver Verification</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{user?.email}</p>
        </div>
        <RefreshButton onClick={onRefresh} refreshing={refreshing} />
      </div>

      {loading ? (
        <Card>
          <p className="text-sm">Loading pending verifications…</p>
        </Card>
      ) : pending.length === 0 ? (
        <Card>
          <p className="text-sm text-on-surface-variant">No pending driver verifications.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((item) => (
            <Card key={item.id}>
              <div className="mb-3">
                <p className="font-display text-xl text-on-surface">{item.user.name}</p>
                <p className="text-sm text-on-surface-variant">{item.user.email}</p>
                {item.user.phone && (
                  <p className="text-sm text-on-surface-variant">{item.user.phone}</p>
                )}
              </div>

              <dl className="mb-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-on-surface-variant">Vehicle</dt>
                  <dd className="text-right text-on-surface">
                    {item.vehicleType} · {item.vehicleNumber}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-on-surface-variant">License</dt>
                  <dd className="text-right text-on-surface">{item.licenseNumber ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-on-surface-variant">Government ID</dt>
                  <dd className="text-right text-on-surface">{item.governmentIdNumber ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-on-surface-variant">Submitted</dt>
                  <dd className="text-right text-on-surface">
                    {formatSubmittedAt(item.verificationSubmittedAt)}
                  </dd>
                </div>
              </dl>

              <Input
                label="Rejection reason (optional)"
                value={rejectionReasons[item.user.id] ?? ''}
                onChange={(e) =>
                  setRejectionReasons((prev) => ({
                    ...prev,
                    [item.user.id]: e.target.value,
                  }))
                }
                placeholder="Shown to driver if rejected"
              />

              <div className="mt-4 flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handleReview(item.user.id, 'VERIFIED')}
                  loading={actionUserId === item.user.id}
                  disabled={actionUserId !== null}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleReview(item.user.id, 'REJECTED')}
                  loading={actionUserId === item.user.id}
                  disabled={actionUserId !== null}
                >
                  <ShieldX className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="mt-8 w-full rounded-3xl border border-glass-border px-5 py-4 text-sm font-semibold text-red-400 transition hover:bg-white/10"
      >
        Sign Out
      </button>
    </div>
  );
}
