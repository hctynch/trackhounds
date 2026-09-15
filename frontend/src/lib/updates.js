import { API_BASE_URL } from '../config';

/**
 * The one network call TrackHounds makes, and only when the user clicks "Check for updates". The
 * server asks GitHub's "latest release" endpoint (pre-releases are not included) because the JavaFX
 * window's WebKit cannot make HTTPS requests itself; nothing is called without the click.
 */
export const LATEST_RELEASE_API = `${API_BASE_URL}/app/latest-release`;

/**
 * @returns {Promise<{version: string, name: string, url: string, publishedAt: string}>}
 * @throws when GitHub cannot be reached or answers with an error
 */
export async function fetchLatestRelease(timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(LATEST_RELEASE_API, { headers: { Accept: 'application/json' }, signal: controller.signal });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message || `The server answered ${response.status}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}
