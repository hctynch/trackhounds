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
 * The page holds a Server-Sent Events connection to /app/events and sends a
 * beacon to /app/window-closed when it unloads, so the Java process can exit
 * once the last window is closed. When the application shuts down first (for
 * example from the tray icon) a full-screen notice is shown.
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
    <div className="fixed inset-0 z-[100] bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">TrackHounds has been closed</h1>
        <p className="text-gray-600">
          The application was shut down. You can close this window and start TrackHounds again from its
          shortcut whenever you need it.
        </p>
      </div>
    </div>
  );
}

export default AppLifecycle;
