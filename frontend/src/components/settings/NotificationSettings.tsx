import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  areNotificationsSupported,
  getNotificationPreference,
  requestNotificationPermission,
  setNotificationPreference,
} from '@/lib/notifications';
import { useToastStore } from '@/store/toastStore';

export function NotificationSettings() {
  const addToast = useToastStore((s) => s.addToast);
  const [enabled, setEnabled] = useState(getNotificationPreference());

  if (!areNotificationsSupported()) {
    return (
      <Card>
        <p className="text-sm text-on-surface-variant">
          Browser notifications are not supported on this device.
        </p>
      </Card>
    );
  }

  const handleToggle = async () => {
    if (!enabled) {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        setEnabled(true);
        addToast('success', 'Notifications enabled');
      } else if (permission === 'denied') {
        addToast('error', 'Notifications blocked in browser settings');
      }
      return;
    }
    setNotificationPreference(false);
    setEnabled(false);
    addToast('info', 'Notifications disabled');
  };

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed/40">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-on-surface">Ride notifications</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Get alerts when rides are accepted, started, or cancelled (when this tab is in the
            background).
          </p>
          <Button
            type="button"
            variant={enabled ? 'secondary' : 'primary'}
            className="mt-3 h-9 px-4 text-xs"
            onClick={handleToggle}
          >
            {enabled ? 'Disable notifications' : 'Enable notifications'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
