import { stakeForNumber } from './hunt';

/** Parse CSV text into rows of cells. Handles quoted cells, doubled quotes, and CRLF line ends. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const source = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ''));
}

const HEADER_NAMES = {
  number: ['number', 'no', 'num', 'dog', 'dognumber', 'dogno', 'id'],
  name: ['name', 'dogname', 'hound'],
  stake: ['stake', 'staketype', 'class'],
  sire: ['sire', 'father'],
  dam: ['dam', 'mother'],
  owner: ['owner', 'ownerkennel', 'kennel', 'handler'],
};

const normalizeHeader = (value) => String(value || '').toLowerCase().replace(/[^a-z]/g, '');

/** Map a header row to field positions; null when the row does not look like a header. */
function detectHeader(cells) {
  const positions = {};
  cells.forEach((cell, index) => {
    const key = normalizeHeader(cell);
    const field = Object.keys(HEADER_NAMES).find((name) => HEADER_NAMES[name].includes(key));
    if (field && positions[field] === undefined) positions[field] = index;
  });
  return positions.number !== undefined && positions.name !== undefined ? positions : null;
}

/** Accepts the ways people write a stake in a spreadsheet. Returns null when unrecognised. */
export function normalizeStake(value) {
  const key = normalizeHeader(value);
  if (key === '') return '';
  if (['allage', 'aa', 'a', 'all', 'open'].includes(key)) return 'ALL_AGE';
  if (['derby', 'd'].includes(key)) return 'DERBY';
  return null;
}

/**
 * Turn CSV text into dog rows for the Add dogs page.
 *
 * A header row naming at least "number" and "name" decides the columns; without one the columns are
 * number, name, stake, sire, dam, owner in that order. Rows without a number or name, with a number
 * that is not digits, or with an unrecognised stake are skipped and reported.
 */
export function dogsFromCsv(text, hunt) {
  const rows = parseCsv(text);
  if (rows.length === 0) return { dogs: [], skipped: [], hasOwner: false };
  let positions = detectHeader(rows[0]);
  let start = 1;
  if (!positions) {
    positions = { number: 0, name: 1, stake: 2, sire: 3, dam: 4, owner: 5 };
    start = 0;
  }
  const at = (cells, field) => (positions[field] === undefined ? '' : String(cells[positions[field]] ?? '').trim());

  const dogs = [];
  const skipped = [];
  const seen = new Set();
  let hasOwner = false;
  for (let index = start; index < rows.length; index += 1) {
    const cells = rows[index];
    const line = index + 1;
    const number = at(cells, 'number');
    const name = at(cells, 'name');
    if (!number && !name) continue;
    if (!number || !name) {
      skipped.push({ line, reason: `Line ${line}: needs both a number and a name.` });
      continue;
    }
    if (!/^[0-9]{1,6}$/.test(number)) {
      skipped.push({ line, reason: `Line ${line}: "${number}" is not a dog number (digits only).` });
      continue;
    }
    if (seen.has(number)) {
      skipped.push({ line, reason: `Line ${line}: dog ${number} appears more than once.` });
      continue;
    }
    let stake = normalizeStake(at(cells, 'stake'));
    if (stake === null) {
      skipped.push({ line, reason: `Line ${line}: stake "${at(cells, 'stake')}" is not All age or Derby.` });
      continue;
    }
    if (stake === '') stake = stakeForNumber(hunt, parseInt(number, 10)) || 'ALL_AGE';
    const owner = at(cells, 'owner');
    if (owner) hasOwner = true;
    seen.add(number);
    dogs.push({ number, name, stake, sire: at(cells, 'sire'), dam: at(cells, 'dam'), owner });
  }
  return { dogs, skipped, hasOwner };
}
