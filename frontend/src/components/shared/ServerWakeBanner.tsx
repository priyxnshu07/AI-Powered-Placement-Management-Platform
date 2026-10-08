import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SHOW_AFTER_MS = 2500; // a warm server answers well before this
const RETRY_EVERY_MS = 5000;

/**
 * The demo backend runs on a free tier that sleeps after inactivity, so the
 * first visitor waits ~30-60s while it boots. Without feedback that looks
 * broken. This pings /api/health on load and shows a notice only if the
 * server is slow to answer, then hides itself once it is up.
 */
const ServerWakeBanner = () => {
  const [state, setState] = useState<'checking' | 'waking' | 'ready'>('checking');

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;
    const slowTimer = setTimeout(() => {
      if (!cancelled) setState((s) => (s === 'checking' ? 'waking' : s));
    }, SHOW_AFTER_MS);

    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
        if (res.ok) {
          if (!cancelled) setState('ready');
          clearTimeout(slowTimer);
          return;
        }
      } catch {
        /* still waking up, or offline: retry below */
      }
      if (!cancelled) retryTimer = setTimeout(ping, RETRY_EVERY_MS);
    };
    ping();

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
      clearTimeout(retryTimer);
    };
  }, []);

  if (state !== 'waking') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: 'var(--warning-light)',
        color: 'var(--warning)',
        borderBottom: '1px solid currentColor',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: '0.9rem',
      }}
    >
      <strong>Waking up the demo server…</strong> It sleeps when idle on free hosting, so the first load can take
      up to a minute. This message disappears once it's ready.
    </div>
  );
};

export default ServerWakeBanner;
