// Configuration for the TrackHounds user interface.
//
// In the packaged desktop application the UI is served by the embedded Java
// server itself, so API calls are relative to the current origin. During UI
// development (`npm run dev`) Vite serves the UI on port 3000 and the backend
// runs separately on port 8080; VITE_API_BASE_URL can override either case.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8080' : '');

// Utility to check backend connection
export async function checkBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/actuator/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Backend connection check failed:', error);
    return false;
  }
}

// Information about the running application (version, data folder, ...)
export async function getAppInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/app/info`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Could not load application info:', error);
    return null;
  }
}
