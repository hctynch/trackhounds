import ReportService from '../services/ReportService';
import { STAKE_LABELS } from '../components/ui/Badge';

/**
 * Report definitions: what a sheet is made of, without code. A definition names a dataset (the
 * rows), the columns in print order, the filters (fixed, or "ask" when the sheet is opened), a sort
 * and a title template. Built-in sheets and saved custom sheets share this shape and this runner.
 */

export const DATASETS = [
  { value: 'dogs', label: 'Dogs', description: 'One row per registered dog, ranked overall or for one day.' },
  { value: 'scores', label: 'Scores', description: 'One row per dog placing in a cross.' },
  { value: 'scratches', label: 'Scratches', description: 'One row per scratch.' },
  { value: 'judges', label: 'Judges', description: 'One row per judge with what they recorded.' },
];

export const ASK = 'ask';

export const DEFAULT_ANSWERS = { day: 1, stake: 'ALL', limit: 10, dogNumber: '', judgeNumber: '' };

/** The filters a dataset understands. */
export function filtersFor(dataset) {
  return {
    day: true,
    stake: true,
    limit: true,
    dogNumber: dataset === 'scores',
    judgeNumber: dataset === 'scores' || dataset === 'scratches',
    includeScratched: dataset === 'dogs',
    scoredOnly: dataset === 'dogs',
    splitByStake: dataset !== 'judges',
  };
}

export function emptyDefinition() {
  return {
    name: '',
    description: '',
    dataset: 'dogs',
    columns: [{ key: 'place' }, { key: 'number' }, { key: 'name' }, { key: 'total' }],
    filters: { day: null, stake: ASK, limit: ASK, dogNumber: null, judgeNumber: null, includeScratched: true, scoredOnly: true, splitByStake: false, dayAllowAll: false },
    sort: { key: 'rank', direction: 'asc' },
    title: '{name}, {stake}',
  };
}

/** The filter questions a definition asks when it is opened. */
export function askedFilters(definition) {
  const filters = definition.filters || {};
  const allowed = filtersFor(definition.dataset);
  return ['day', 'stake', 'limit', 'dogNumber', 'judgeNumber'].filter((key) => allowed[key] && filters[key] === ASK);
}

/** Stable id from a name, for saving. */
export function slugify(name) {
  const slug = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
  return slug || 'report';
}

const stakeWords = (stake) => (stake === 'ALL_AGE' ? 'all age' : stake === 'DERBY' ? 'derby' : 'all dogs');

/** Fill the placeholders of a title template. */
export function formatTitle(template, values) {
  const map = {
    name: values.name || '',
    hunt: values.hunt || '',
    day: values.day ? `day ${values.day}` : 'all days',
    dayNumber: values.day ? String(values.day) : '',
    stake: stakeWords(values.stake),
    limit: values.limit ? String(values.limit) : '',
    dogNumber: values.dogNumber || '',
    judgeNumber: values.judgeNumber || '',
  };
  const text = String(template || '{name}').replace(/\{(\w+)\}/g, (match, key) => (key in map ? map[key] : match));
  const cleaned = text.replace(/,\s*(,|$)/g, '$1').replace(/\s+,/g, ',').trim().replace(/,$/, '');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** The values the run uses: fixed filters, or the answers for the asked ones. */
export function resolveFilters(definition, answers = {}) {
  const filters = definition.filters || {};
  const allowed = filtersFor(definition.dataset);
  const pick = (key, fallback) => {
    if (!allowed[key]) return null;
    const value = filters[key];
    if (value === ASK) {
      const answer = answers[key];
      return answer === undefined || answer === null || answer === '' ? fallback : answer;
    }
    return value === undefined ? null : value;
  };
  const rawDay = pick('day', filters.dayAllowAll ? 'all' : DEFAULT_ANSWERS.day);
  const day = rawDay === 'all' || rawDay === null || rawDay === '' ? null : Number(rawDay);
  const rawLimit = pick('limit', DEFAULT_ANSWERS.limit);
  const limit = rawLimit === null || rawLimit === '' ? null : Math.max(1, Number(rawLimit) || 1);
  return {
    day: Number.isFinite(day) && day > 0 ? day : null,
    stake: pick('stake', DEFAULT_ANSWERS.stake) || 'ALL',
    limit,
    dogNumber: String(pick('dogNumber', DEFAULT_ANSWERS.dogNumber) || '').trim(),
    judgeNumber: String(pick('judgeNumber', DEFAULT_ANSWERS.judgeNumber) || '').trim(),
    includeScratched: allowed.includeScratched ? filters.includeScratched !== false : true,
    scoredOnly: allowed.scoredOnly ? Boolean(filters.scoredOnly) : false,
    splitByStake: allowed.splitByStake ? Boolean(filters.splitByStake) : false,
  };
}

/** Expand wildcard column keys ("sdDay*") against a dataset's catalogue and drop unknown keys. */
export function expandColumns(definitionColumns, catalogue, { dual, stake }) {
  const known = new Map(catalogue.map((column) => [column.key, column]));
  const result = [];
  (definitionColumns || []).forEach((column) => {
    if (column.auto && !(dual && stake === 'ALL')) return;
    if (column.key.endsWith('*')) {
      const prefix = column.key.slice(0, -1);
      catalogue.filter((entry) => entry.key.startsWith(prefix) && /^\d+$/.test(entry.key.slice(prefix.length))).forEach((entry) => result.push({ ...entry, label: entry.label }));
      return;
    }
    const entry = known.get(column.key);
    if (!entry) return;
    result.push({ ...entry, label: column.label || entry.label, bold: Boolean(column.bold) });
  });
  return result;
}

const formatValue = (column, value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : '';
  if (column.key === 'stake') return STAKE_LABELS[value] || String(value);
  return String(value);
};

/** Rows to printable cells. The scratched mark goes on the name, or on the number without a name. */
function toCells(rows, columns) {
  const nameIndex = columns.findIndex((column) => column.key === 'name' || column.key === 'dogName');
  const numberIndex = columns.findIndex((column) => column.key === 'number' || column.key === 'dogNumber');
  const markIndex = nameIndex >= 0 ? nameIndex : numberIndex;
  return rows.map((row) => {
    const cells = columns.map((column) => formatValue(column, row[column.key]));
    if (row.scratched && markIndex >= 0) cells[markIndex] = `${cells[markIndex]} (scratched)`.trim();
    return cells;
  });
}

function sortRows(rows, sort, catalogue) {
  if (!sort || !sort.key || sort.key === 'rank') return rows;
  const column = catalogue.find((entry) => entry.key === sort.key);
  if (!column) return rows;
  const direction = sort.direction === 'desc' ? -1 : 1;
  const compare = (a, b) => {
    const x = a[sort.key];
    const y = b[sort.key];
    if (x === y) return 0;
    if (x === null || x === undefined) return 1;
    if (y === null || y === undefined) return -1;
    if (column.numeric || (column.key === 'number' && /^\d+$/.test(String(x)) && /^\d+$/.test(String(y)))) {
      const nx = Number(x);
      const ny = Number(y);
      if (nx !== ny) return (nx - ny) * direction;
      return (String(x).length - String(y).length) * direction;
    }
    return String(x).localeCompare(String(y), undefined, { numeric: true }) * direction;
  };
  return [...rows].sort(compare);
}

/** Consecutive columns with the same group become one header group; a group of one column is not worth a heading. */
export function groupsOf(columns) {
  const groups = [];
  columns.forEach((column, index) => {
    const last = groups[groups.length - 1];
    if (column.group && last && last.title === column.group && last.start + last.span === index) {
      last.span += 1;
    } else if (column.group) {
      groups.push({ title: column.group, start: index, span: 1 });
    }
  });
  return groups.filter((group) => group.span > 1);
}

async function runOnce(definition, filters, stake) {
  const params = {
    day: filters.day,
    stake: stake === 'ALL' ? null : stake,
    dog: filters.dogNumber || null,
    judge: filters.judgeNumber || null,
  };
  const dataset = await ReportService.getDataset(definition.dataset, params);
  if (!dataset || !Array.isArray(dataset.rows)) throw new Error(dataset?.message || 'The rows could not be loaded.');
  const catalogue = dataset.columns || [];
  let rows = dataset.rows;
  if (!filters.includeScratched) rows = rows.filter((row) => !row.scratched);
  if (filters.scoredOnly && definition.dataset === 'dogs') rows = rows.filter((row) => row.place !== null && row.place !== undefined);
  rows = sortRows(rows, definition.sort, catalogue);
  if (filters.limit) rows = rows.slice(0, filters.limit);
  const columns = expandColumns(definition.columns, catalogue, { dual: dataset.dual, stake });
  return {
    dual: Boolean(dataset.dual),
    columns: columns.map((column) => column.label),
    columnGroups: groupsOf(columns),
    boldColumns: columns.map((column, index) => (column.bold ? index : -1)).filter((index) => index >= 0),
    data: toCells(rows, columns),
  };
}

/**
 * Run a definition with the answers to its questions. Returns what ReportGenerator renders:
 * a title with either one table or one section per stake.
 */
export async function runDefinition(definition, answers = {}, hunt = null) {
  const filters = resolveFilters(definition, answers);
  // A sheet that asks for a dog or a judge prints nothing until the number is typed.
  const asked = askedFilters(definition);
  if ((asked.includes('dogNumber') && !filters.dogNumber) || (asked.includes('judgeNumber') && !filters.judgeNumber)) {
    return { title: formatTitle(definition.title, { ...filters, name: definition.name, hunt: hunt?.title }), day: filters.day, columns: [], data: [] };
  }
  const titleValues = { ...filters, name: definition.name, hunt: hunt?.title };
  const dual = hunt?.stake === 'DUAL';
  if (filters.splitByStake && dual && filters.stake === 'ALL') {
    const [allAge, derby] = await Promise.all([runOnce(definition, filters, 'ALL_AGE'), runOnce(definition, filters, 'DERBY')]);
    return {
      title: formatTitle(definition.title, { ...titleValues, stake: 'ALL' }),
      day: filters.day,
      sections: [
        { title: 'All age', columns: allAge.columns, columnGroups: allAge.columnGroups, boldColumns: allAge.boldColumns, data: allAge.data, emptyText: 'No all age rows.' },
        { title: 'Derby', columns: derby.columns, columnGroups: derby.columnGroups, boldColumns: derby.boldColumns, data: derby.data, emptyText: 'No derby rows.' },
      ],
      data: [],
    };
  }
  const result = await runOnce(definition, filters, filters.stake);
  return { title: formatTitle(definition.title, titleValues), day: filters.day, ...result };
}
