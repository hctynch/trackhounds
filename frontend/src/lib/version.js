/**
 * Version strings as the build and the release tags write them: "3.0.0", "v3.1.0", "3.0.0-rc.1".
 * A pre-release sorts before the release it precedes ("3.0.0-rc.1" < "3.0.0").
 */
export function parseVersion(text) {
  const match = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?/.exec(String(text || '').trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2] || 0),
    patch: Number(match[3] || 0),
    pre: match[4] ? match[4].split('.') : null,
  };
}

/** Negative when a < b, positive when a > b, zero when equal; null when either does not parse. */
export function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) return null;
  for (const part of ['major', 'minor', 'patch']) {
    if (left[part] !== right[part]) return left[part] - right[part];
  }
  if (!left.pre && !right.pre) return 0;
  if (!left.pre) return 1;
  if (!right.pre) return -1;
  const length = Math.max(left.pre.length, right.pre.length);
  for (let i = 0; i < length; i += 1) {
    const x = left.pre[i];
    const y = right.pre[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const numeric = /^\d+$/.test(x) && /^\d+$/.test(y);
    if (numeric && Number(x) !== Number(y)) return Number(x) - Number(y);
    if (!numeric && x !== y) return x < y ? -1 : 1;
  }
  return 0;
}
