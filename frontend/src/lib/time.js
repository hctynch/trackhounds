/**
 * Times as scorekeepers type them. A time can be entered with a colon ("06:05", "6:05") or as
 * digits only ("0605", "605", "1300"); with digits only, the last two are the minutes.
 */

const pad = (value) => String(value).padStart(2, '0');

/**
 * Read a typed time.
 * @param {string} text what was typed, or a time from the server ("06:05:00")
 * @returns {string|null} the time as "HH:MM", or null when the text is not a time of day
 */
export function parseTime(text) {
  const raw = String(text ?? '').trim();
  let hours;
  let minutes;
  const withColon = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(raw);
  const digitsOnly = /^(\d{1,2})(\d{2})$/.exec(raw);
  if (withColon) {
    hours = Number(withColon[1]);
    minutes = Number(withColon[2]);
  } else if (digitsOnly) {
    hours = Number(digitsOnly[1]);
    minutes = Number(digitsOnly[2]);
  } else {
    return null;
  }
  if (hours > 23 || minutes > 59) return null;
  return `${pad(hours)}:${pad(minutes)}`;
}

/** A time for display: "HH:MM" for anything parseTime reads, otherwise the text unchanged. */
export function formatTime(text) {
  return parseTime(text) ?? String(text ?? '');
}

/** What to tell the operator when a time cannot be read. */
export const TIME_HELP = 'Enter the time as 0600 or 06:00.';
