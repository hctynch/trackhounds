/**
 * Files and links that leave the page. Inside the JavaFX window WebKit has no download manager
 * (a `download` link would navigate the window to the file's text) and no way to open a browser,
 * so both go through the window's bridge; in a browser the normal anchor behaviour is used.
 */

const bridge = () => (typeof window !== 'undefined' ? window.trackhoundsWindow : undefined);

/** Whether the page runs inside the JavaFX application window. */
export function inDesktopWindow() {
  return Boolean(bridge());
}

/** Save what `url` serves as a file; `name` is the suggested file name. */
export function downloadFile(url, name) {
  const absolute = new URL(url, window.location.href).href;
  const desktop = bridge();
  if (desktop && typeof desktop.saveFile === 'function') {
    desktop.saveFile(absolute, name || '');
    return;
  }
  const anchor = document.createElement('a');
  anchor.href = absolute;
  anchor.download = name || '';
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * Click handler for links that must open outside the application. Returns without doing anything
 * in a browser, where the anchor's target=_blank does the job.
 */
export function openExternal(event, href) {
  const desktop = bridge();
  if (desktop && typeof desktop.openExternal === 'function') {
    event.preventDefault();
    desktop.openExternal(href);
  }
}
