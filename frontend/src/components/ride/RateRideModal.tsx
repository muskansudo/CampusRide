import { useState } from 'react';
import { Star } from 'lucide-react';
import type { Ride } from '@/types';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface RateRideModalProps {
  ride: Ride;
  open: boolean;
  onClose: () => void;
}

export function RateRideModal({ ride, open, onClose }: RateRideModalProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const driverName = ride.driver?.name || 'your driver';

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setLoading(true);
    try {
      await api.rateRide(ride.id, rating, feedback || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/25 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <Card variant="deep" className="w-full max-w-[430px] rounded-b-none rounded-t-[32px] page-enter sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-on-surface-variant/20 sm:hidden" />
        <div className="mb-4 flex items-center gap-3">
          <UserAvatar name={driverName} size="md" ring />
          <div>
            <h3 className="font-display text-2xl">Rate your ride</h3>
            <p className="text-sm text-on-surface-variant">How was your ride with {driverName}?</p>
          </div>
        </div>

        <div className="my-6 flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition hover:scale-110"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className="h-9 w-9"
                fill={star <= rating ? 'var(--color-primary)' : 'transparent'}
                stroke={star <= rating ? 'var(--color-primary)' : 'var(--color-outline-variant)'}
              />
            </button>
          ))}
        </div>

        <label className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Feedback
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          className="w-full resize-none rounded-2xl border border-glass-border bg-white/25 p-4 text-sm text-on-surface outline-none backdrop-blur-sm placeholder:text-outline-variant focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
        />

        {error && <p className="mt-2 text-xs text-error">{error}</p>}

        <Button size="lg" loading={loading} onClick={handleSubmit} className="mt-4 w-full">
          Submit
        </Button>
        <Button variant="secondary" size="lg" onClick={onClose} className="mt-3 w-full">
          Skip
        </Button>
      </Card>
    </div>
  );
}
