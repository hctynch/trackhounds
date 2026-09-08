import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

// One id per page load. The desktop launcher uses it to know which window went away.
const CLIENT_ID =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * Keeps the desktop application alive while this page is open.
 *
 * The page holds a Server-Sent Events connection to /app/events and sends a beacon to
 * /app/window-closed when it unloads, so the Java process can exit once the last window is closed.
 * When the application shuts down first (for example from the tray icon) a full-screen notice is shown.
 */
function AppLifecycle() {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined;

    const source = new EventSource(`${API_BASE_URL}/app/events?client=${encodeURIComponent(CLIENT_ID)}`);
    source.addEventListener('shutdown', () => {
      setClosed(true);
      source.close();
    });

    const onPageHide = () => {
      try {
        navigator.sendBeacon(`${API_BASE_URL}/app/window-closed`, CLIENT_ID);
      } catch {
        // Best effort only; the server also notices the dropped connection.
      }
    };
    window.addEventListener('pagehide', onPageHide);

    return () => {
      source.close();
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  if (!closed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas p-6">
      <div className="max-w-md rounded-lg border border-line bg-surface p-8 text-center shadow-pop">
        <p className="font-serif text-title font-semibold text-pine-800">TrackHounds is closed</p>
        <p className="mt-3 text-body text-ink-muted">
          The application was shut down from the tray icon. Close this window and start TrackHounds again from its shortcut when you need it.
        </p>
      </div>
    </div>
  );
}

export default AppLifecycle;
