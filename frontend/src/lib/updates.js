/**
 * The one network call TrackHounds makes, and only when the user clicks "Check for updates":
 * GitHub's "latest release" endpoint (pre-releases are not included).
 */
export const LATEST_RELEASE_API = 'https://api.github.com/repos/hctynch/trackhounds/releases/latest';

/**
 * @returns {Promise<{version: string, name: string, url: string, publishedAt: string}>}
 * @throws when GitHub cannot be reached or answers with an error
 */
export async function fetchLatestRelease(timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(LATEST_RELEASE_API, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
    const release = await response.json();
    return { version: release.tag_name, name: release.name, url: release.html_url, publishedAt: release.published_at };
  } finally {
    clearTimeout(timer);
  }
}
