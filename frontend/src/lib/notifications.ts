const PREF_KEY = 'campusride_notifications_enabled';

export function areNotificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPreference(): boolean {
  return localStorage.getItem(PREF_KEY) === 'true';
}

export function setNotificationPreference(enabled: boolean) {
  localStorage.setItem(PREF_KEY, String(enabled));
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!areNotificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') {
    setNotificationPreference(true);
    return 'granted';
  }
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  if (result === 'granted') setNotificationPreference(true);
  return result;
}

export function showBrowserNotification(title: string, body: string, tag?: string) {
  if (!areNotificationsSupported()) return;
  if (Notification.permission !== 'granted') return;
  if (!getNotificationPreference()) return;
  if (document.visibilityState === 'visible') return;

  try {
    new Notification(title, { body, tag, icon: '/favicon.ico' });
  } catch {
    // ignore
  }
}
