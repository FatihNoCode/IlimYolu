import { useEffect, useState } from 'react';

// One unread count, shared by everything that shows it.
//
// The number belongs on the avatar — that is where a user looks to find out
// whether anything happened while they were away, and an account button with
// nothing on it reads as "nothing new". But the avatar renders in five
// dashboards and the notification list renders in one, and if each of them
// fetched on its own timer they would poll five times a minute and still
// disagree with each other for up to a minute after a user opened the list.
//
// So the count lives here: one poll, one truth, and anything that already
// knows better (the panel that just marked everything read) can push the new
// value in without waiting for the next tick.

let count = 0;
let subscribers = new Set<(n: number) => void>();
let started = false;
let timer: ReturnType<typeof setInterval> | null = null;
let removeResume = () => {};

export function setUnreadCount(next: number) {
  const safe = Number.isFinite(next) && next > 0 ? Math.floor(next) : 0;
  if (safe === count) return;
  count = safe;
  subscribers.forEach((fn) => fn(count));
}

// Starts the shared poll on first use and stops it when the last consumer
// unmounts — i.e. on logout, where continuing to poll would just log a stream
// of 401s.
function start(apiRequest: (endpoint: string, options?: RequestInit) => Promise<any>) {
  if (started) return;
  started = true;

  const refresh = async () => {
    try {
      const data = await apiRequest('/notifications');
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // A failed poll leaves the last known count alone. Blanking the badge on
      // a dropped connection would quietly hide a real notification.
    }
  };

  refresh();
  timer = setInterval(refresh, 60000);

  // Timers don't run while the app is suspended, so on iOS the badge would be
  // as stale as the time since the phone was locked. Refreshing on resume is
  // what makes the count right at the moment the user actually looks at it.
  (async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      const { App: CapApp } = await import('@capacitor/app');
      const handle = await CapApp.addListener('resume', refresh);
      removeResume = () => { handle.remove(); };
    } catch {
      /* web, or the plugin isn't there — the interval is enough */
    }
  })();
}

function stop() {
  started = false;
  if (timer) clearInterval(timer);
  timer = null;
  removeResume();
  removeResume = () => {};
}

export function useUnreadCount(
  apiRequest: (endpoint: string, options?: RequestInit) => Promise<any>,
): number {
  const [value, setValue] = useState(count);

  useEffect(() => {
    subscribers.add(setValue);
    start(apiRequest);
    return () => {
      subscribers.delete(setValue);
      if (subscribers.size === 0) stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}
