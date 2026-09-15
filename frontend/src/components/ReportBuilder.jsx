import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuArrowDown, LuArrowUp, LuSave, LuX } from 'react-icons/lu';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import { huntDays, isDualHunt } from '../lib/hunt';
import { ASK, DATASETS, DEFAULT_ANSWERS, emptyDefinition, expandColumns, filtersFor, runDefinition, slugify } from '../lib/reports';
import ReportService from '../services/ReportService';
import ReportGenerator from './ReportGenerator';
import DefinitionOptions from './Reports/DefinitionOptions';
import builtinReports from './Reports/builtin';
import { Alert, Button, Field, IconButton, Input, PageHeader, Panel, PanelBody, PanelFooter, PanelHeader, Select, useToast } from './ui';

const FIXED = 'fixed';
const NONE = 'none';

/** A filter's mode select: not filtered, fixed value, or ask when the sheet is opened. */
function ModeSelect({ id, value, onChange, noneLabel, fixedLabel = 'Always', askLabel = 'Ask when opened' }) {
  return (
    <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
      {noneLabel && <option value={NONE}>{noneLabel}</option>}
      <option value={FIXED}>{fixedLabel}</option>
      <option value={ASK}>{askLabel}</option>
    </Select>
  );
}

ModeSelect.propTypes = {
  id: (props, name) => (typeof props[name] === 'string' || props[name] === undefined ? null : new Error('id must be a string')),
  value: (props, name) => (typeof props[name] === 'string' ? null : new Error('value is required')),
  onChange: (props, name) => (typeof props[name] === 'function' ? null : new Error('onChange is required')),
  noneLabel: () => null,
  fixedLabel: () => null,
  askLabel: () => null,
};

const modeOf = (value, noneAllowed) => (value === ASK ? ASK : value === null || value === undefined || value === '' ? (noneAllowed ? NONE : FIXED) : FIXED);

/**
 * Compose a printable sheet without code: pick the rows, the columns in order, the filters that are
 * fixed or asked when the sheet is opened, a sort and a title. The preview is the real sheet.
 */
function ReportBuilder() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hunt } = useHunt();
  const from = search.get('from');

  const [definition, setDefinition] = useState(null);
  const [catalogue, setCatalogue] = useState([]);
  const [dual, setDual] = useState(false);
  const [answers, setAnswers] = useState({ ...DEFAULT_ANSWERS });
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Load what we start from: a saved layout, a built-in to customise, or a blank definition.
  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      if (id) {
        const layout = await ReportService.getLayout(id);
        if (cancelled) return;
        if (!layout || !layout.dataset) {
          setLoadError(layout?.message || 'That report could not be loaded.');
          return;
        }
        setDefinition({ ...emptyDefinition(), ...layout, filters: { ...emptyDefinition().filters, ...(layout.filters || {}) } });
        return;
      }
      const base = from ? builtinReports.find((report) => report.id === from) : null;
      if (base) {
        const copy = JSON.parse(JSON.stringify(base));
        delete copy.id;
        delete copy.group;
        delete copy.builtin;
        copy.name = `${base.name} (custom)`;
        copy.filters = { ...emptyDefinition().filters, ...copy.filters };
        setDefinition(copy);
      } else {
        setDefinition(emptyDefinition());
      }
    };
    start();
    return () => {
      cancelled = true;
    };
  }, [id, from]);

  // The dataset's column catalogue for the current hunt.
  useEffect(() => {
    if (!definition) return undefined;
    let cancelled = false;
    ReportService.getDataset(definition.dataset, { day: definition.filters?.day === ASK || !definition.filters?.day ? 1 : definition.filters.day, limit: 1 }).then((dataset) => {
      if (cancelled) return;
      setCatalogue(Array.isArray(dataset?.columns) ? dataset.columns : []);
      setDual(Boolean(dataset?.dual));
    });
    return () => {
      cancelled = true;
    };
  }, [definition?.dataset, definition?.filters?.day]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live preview.
  useEffect(() => {
    if (!definition || definition.columns.length === 0) {
      setPreview(null);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      runDefinition(definition, answers, hunt)
        .then((result) => {
          if (!cancelled) {
            setPreview(result);
            setPreviewError('');
          }
        })
        .catch((err) => {
          if (!cancelled) setPreviewError(err?.message || 'The preview could not be prepared.');
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [definition, answers, hunt]);

  const update = useCallback((patch) => setDefinition((current) => ({ ...current, ...patch })), []);
  const updateFilters = useCallback((patch) => setDefinition((current) => ({ ...current, filters: { ...current.filters, ...patch } })), []);

  const allowed = useMemo(() => (definition ? filtersFor(definition.dataset) : {}), [definition]);
  const selectedKeys = useMemo(() => new Set((definition?.columns || []).map((column) => column.key)), [definition]);

  // Columns are shown as the dataset lists them; day columns of the current hunt are offered one by one
  // and as "every day" so a sheet follows the hunt's day count.
  const catalogueChoices = useMemo(() => {
    const choices = [];
    const seenPrefixes = new Set();
    catalogue.forEach((column) => {
      const match = /^(.*Day)(\d+)$/.exec(column.key);
      if (match && !seenPrefixes.has(match[1])) {
        seenPrefixes.add(match[1]);
        choices.push({ key: `${match[1]}*`, label: `${column.group || match[1]}, every day`, group: column.group, wildcard: true });
      }
      choices.push(column);
    });
    return choices;
  }, [catalogue]);

  const toggleColumn = (choice) => {
    setDefinition((current) => {
      const has = current.columns.some((column) => column.key === choice.key);
      const columns = has ? current.columns.filter((column) => column.key !== choice.key) : [...current.columns, { key: choice.key }];
      return { ...current, columns };
    });
  };

  const moveColumn = (index, delta) => {
    setDefinition((current) => {
      const columns = [...current.columns];
      const target = index + delta;
      if (target < 0 || target >= columns.length) return current;
      [columns[index], columns[target]] = [columns[target], columns[index]];
      return { ...current, columns };
    });
  };

  const relabel = (index, label) => {
    setDefinition((current) => {
      const columns = current.columns.map((column, i) => (i === index ? { ...column, label: label || undefined } : column));
      return { ...current, columns };
    });
  };

  const labelOf = (column) => {
    const choice = catalogueChoices.find((entry) => entry.key === column.key);
    if (!choice) return column.key;
    return choice.group && !choice.wildcard ? `${choice.group}: ${choice.label}` : choice.label;
  };

  const save = async () => {
    const found = {};
    if (!definition.name.trim()) found.name = 'Give the report a name.';
    if (definition.columns.length === 0) found.columns = 'Pick at least one column.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    let targetId = id;
    if (!targetId) {
      const existing = await ReportService.getLayouts();
      const taken = new Set((Array.isArray(existing) ? existing : []).map((layout) => layout.id));
      const base = slugify(definition.name);
      targetId = base;
      for (let n = 2; taken.has(targetId) || builtinReports.some((report) => report.id === targetId) || targetId === 'hunt-summary'; n += 1) targetId = `${base}-${n}`;
    }
    const layout = { ...definition, name: definition.name.trim(), title: definition.title?.trim() || '{name}' };
    delete layout.id;
    delete layout.builtin;
    delete layout.group;
    const saved = await ReportService.saveLayout(targetId, layout);
    setSaving(false);
    if (!saved || !saved.id) {
      setErrors(saved?.fields || { name: saved?.message || 'The report could not be saved.' });
      toast.error(saved?.message || 'The report could not be saved.');
      return;
    }
    toast.success(`"${layout.name}" saved.`);
    navigate(`/reports/${saved.id}`);
  };

  if (loadError) {
    return (
      <>
        <PageHeader backTo="/reports" backLabel="All reports" title="Report builder" />
        <Alert tone="danger" title="That report could not be opened">{loadError}</Alert>
      </>
    );
  }
  if (!definition) return null;

  const filters = definition.filters;
  const days = huntDays(hunt);
  const dayMode = modeOf(filters.day, true);
  const stakeMode = filters.stake === ASK ? ASK : FIXED;
  const limitMode = modeOf(filters.limit, true);
  const previewIsSectioned = Array.isArray(preview?.sections) && preview.sections.length > 0;

  return (
    <>
      <PageHeader
        backTo={id ? `/reports/${id}` : '/reports'}
        backLabel={id ? 'Back to the report' : 'All reports'}
        title={id ? `Edit "${definition.name}"` : 'New report'}
        description="Choose the rows, the columns in print order, the filters and a title. The preview below is the sheet as it prints."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title="Settings" />
            <PanelBody className="grid gap-4">
              <Field label="Name" required error={errors.name}>
                {({ id: fieldId, invalid }) => <Input id={fieldId} invalid={invalid} value={definition.name} onChange={(event) => update({ name: event.target.value })} autoFocus placeholder="Club daily sheet" />}
              </Field>
              <Field label="Description" hint="Shown under the name in the catalogue.">
                {({ id: fieldId }) => <Input id={fieldId} value={definition.description || ''} onChange={(event) => update({ description: event.target.value })} />}
              </Field>
              <Field label="Rows" hint={DATASETS.find((entry) => entry.value === definition.dataset)?.description}>
                {({ id: fieldId }) => (
                  <Select
                    id={fieldId}
                    value={definition.dataset}
                    onChange={(event) => {
                      const dataset = event.target.value;
                      update({ dataset, columns: [], sort: { key: 'rank', direction: 'asc' } });
                    }}
                  >
                    {DATASETS.map((entry) => (
                      <option key={entry.value} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Printed title" hint="Placeholders: {name}, {hunt}, {day}, {dayNumber}, {stake}, {limit}, {dogNumber}, {judgeNumber}.">
                {({ id: fieldId }) => <Input id={fieldId} value={definition.title || ''} onChange={(event) => update({ title: event.target.value })} placeholder="{name}, {stake}" />}
              </Field>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Filters" description="Fixed filters are part of the sheet. Asked filters show a control when the sheet is opened." />
            <PanelBody className="grid gap-4">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
                <Field label="Day">
                  {({ id: fieldId }) => (
                    <ModeSelect
                      id={fieldId}
                      value={dayMode}
                      noneLabel="Whole hunt"
                      fixedLabel="One day"
                      onChange={(mode) => updateFilters({ day: mode === NONE ? null : mode === ASK ? ASK : days[0] })}
                    />
                  )}
                </Field>
                {dayMode === FIXED && (
                  <Field label="Which day">
                    {({ id: fieldId }) => (
                      <Select id={fieldId} value={filters.day} onChange={(event) => updateFilters({ day: Number(event.target.value) })}>
                        {days.map((day) => (
                          <option key={day} value={day}>
                            Day {day}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                )}
                {dayMode === ASK && (
                  <Field label="Choices offered">
                    {({ id: fieldId }) => (
                      <Select id={fieldId} value={filters.dayAllowAll ? 'all' : 'days'} onChange={(event) => updateFilters({ dayAllowAll: event.target.value === 'all' })}>
                        <option value="days">The days of the hunt</option>
                        <option value="all">The days, and all days</option>
                      </Select>
                    )}
                  </Field>
                )}
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
                <Field label="Stake">
                  {({ id: fieldId }) => <ModeSelect id={fieldId} value={stakeMode} fixedLabel="Fixed" onChange={(mode) => updateFilters({ stake: mode === ASK ? ASK : 'ALL' })} />}
                </Field>
                {stakeMode === FIXED && (
                  <Field label="Which stake">
                    {({ id: fieldId }) => (
                      <Select id={fieldId} value={filters.stake || 'ALL'} onChange={(event) => updateFilters({ stake: event.target.value })}>
                        <option value="ALL">All dogs</option>
                        <option value="ALL_AGE">All age</option>
                        <option value="DERBY">Derby</option>
                      </Select>
                    )}
                  </Field>
                )}
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
                <Field label="Number of rows">
                  {({ id: fieldId }) => (
                    <ModeSelect id={fieldId} value={limitMode} noneLabel="All rows" fixedLabel="At most" onChange={(mode) => updateFilters({ limit: mode === NONE ? null : mode === ASK ? ASK : 10 })} />
                  )}
                </Field>
                {limitMode === FIXED && (
                  <Field label="How many">
                    {({ id: fieldId }) => <Input id={fieldId} type="number" numeric min={1} max={500} value={filters.limit} onChange={(event) => updateFilters({ limit: Math.max(1, Number(event.target.value) || 1) })} />}
                  </Field>
                )}
              </div>

              {allowed.dogNumber && (
                <Field label="Dog number" hint="Ask for a dog to list only its rows.">
                  {({ id: fieldId }) => <ModeSelect id={fieldId} value={filters.dogNumber === ASK ? ASK : NONE} noneLabel="Every dog" fixedLabel="Every dog" onChange={(mode) => updateFilters({ dogNumber: mode === ASK ? ASK : null })} />}
                </Field>
              )}
              {allowed.judgeNumber && (
                <Field label="Judge number" hint="Ask for a judge to list only what they recorded.">
                  {({ id: fieldId }) => <ModeSelect id={fieldId} value={filters.judgeNumber === ASK ? ASK : NONE} noneLabel="Every judge" fixedLabel="Every judge" onChange={(mode) => updateFilters({ judgeNumber: mode === ASK ? ASK : null })} />}
                </Field>
              )}

              <div className="grid gap-2 text-body">
                {allowed.scoredOnly && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={Boolean(filters.scoredOnly)} onChange={(event) => updateFilters({ scoredOnly: event.target.checked })} />
                    Only dogs with a place (leave out dogs that have not scored)
                  </label>
                )}
                {allowed.includeScratched && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={filters.includeScratched !== false} onChange={(event) => updateFilters({ includeScratched: event.target.checked })} />
                    Include scratched dogs (marked on the sheet)
                  </label>
                )}
                {allowed.splitByStake && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={Boolean(filters.splitByStake)} onChange={(event) => updateFilters({ splitByStake: event.target.checked })} />
                    In a dual hunt, print the two stakes as separate sections
                  </label>
                )}
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
                <Field label="Sort by">
                  {({ id: fieldId }) => (
                    <Select id={fieldId} value={definition.sort?.key || 'rank'} onChange={(event) => update({ sort: { key: event.target.value, direction: definition.sort?.direction || 'asc' } })}>
                      <option value="rank">{definition.dataset === 'dogs' ? 'Ranking (points, then the tie-break)' : 'Natural order (day, then time)'}</option>
                      {catalogue.map((column) => (
                        <option key={column.key} value={column.key}>
                          {column.group ? `${column.group}: ${column.label}` : column.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                {definition.sort?.key && definition.sort.key !== 'rank' && (
                  <Field label="Direction">
                    {({ id: fieldId }) => (
                      <Select id={fieldId} value={definition.sort.direction || 'asc'} onChange={(event) => update({ sort: { ...definition.sort, direction: event.target.value } })}>
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </Select>
                    )}
                  </Field>
                )}
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title="Columns" description="Tick the columns to print, then order them. A label can be changed for the sheet." />
            {errors.columns && (
              <div className="px-5 pt-4">
                <Alert tone="danger">{errors.columns}</Alert>
              </div>
            )}
            <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:divide-x md:divide-line">
              <div className="max-h-[420px] overflow-y-auto px-5 py-4">
                <p className="mb-2 text-small font-medium text-ink-muted">Available</p>
                <ul className="space-y-1">
                  {catalogueChoices.map((choice) => (
                    <li key={choice.key}>
                      <label className="flex items-center gap-2 text-body">
                        <input type="checkbox" checked={selectedKeys.has(choice.key)} onChange={() => toggleColumn(choice)} />
                        <span>{choice.wildcard ? choice.label : choice.group ? `${choice.group}: ${choice.label}` : choice.label}</span>
                        {choice.key === 'stake' && dual && <span className="text-small text-ink-faint">(dual hunt)</span>}
                      </label>
                    </li>
                  ))}
                  {catalogueChoices.length === 0 && <li className="text-small text-ink-muted">Loading the columns</li>}
                </ul>
              </div>
              <div className="px-5 py-4">
                <p className="mb-2 text-small font-medium text-ink-muted">In print order</p>
                {definition.columns.length === 0 ? (
                  <p className="text-small text-ink-muted">No columns yet.</p>
                ) : (
                  <ol className="space-y-1.5">
                    {definition.columns.map((column, index) => {
                      const defaultLabel = catalogue.find((entry) => entry.key === column.key)?.label || '';
                      return (
                        <li key={column.key} className="rounded-md border border-line px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 shrink-0 text-right text-small text-ink-faint tabular">{index + 1}</span>
                            <span className="min-w-0 flex-1 truncate text-body font-medium" title={labelOf(column)}>
                              {labelOf(column)}
                            </span>
                            <IconButton icon={LuArrowUp} label="Move up" onClick={() => moveColumn(index, -1)} disabled={index === 0} />
                            <IconButton icon={LuArrowDown} label="Move down" onClick={() => moveColumn(index, 1)} disabled={index === definition.columns.length - 1} />
                            <IconButton icon={LuX} label={`Remove ${labelOf(column)}`} onClick={() => toggleColumn(column)} />
                          </div>
                          {!column.key.endsWith('*') && (
                            <Input
                              aria-label={`Label for ${labelOf(column)}`}
                              className="mt-1.5 h-8 text-small"
                              value={column.label || ''}
                              placeholder={`Printed as "${defaultLabel}"`}
                              onChange={(event) => relabel(index, event.target.value)}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
                {definition.columns.length > 0 && expandColumns(definition.columns, catalogue, { dual, stake: 'ALL' }).length === 0 && (
                  <p className="mt-2 text-small text-warning-700">None of these columns exist for the current hunt.</p>
                )}
              </div>
            </div>
            <PanelFooter>
              <Button variant="secondary" onClick={() => navigate(id ? `/reports/${id}` : '/reports')} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" icon={LuSave} onClick={save} loading={saving}>
                {id ? 'Save changes' : 'Save report'}
              </Button>
            </PanelFooter>
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        {preview || previewError ? (
          <ReportGenerator
            hunt={hunt || undefined}
            day={preview?.day || undefined}
            title={preview?.title || definition.name || 'Preview'}
            description={previewError || (isDualHunt(hunt) && !previewIsSectioned ? 'Preview with the current hunt. Stake column and sections follow the dual hunt rules.' : 'Preview with the current hunt.')}
            columns={preview?.columns || []}
            columnGroups={preview?.columnGroups}
            boldColumns={preview?.boldColumns}
            data={preview?.data || []}
            sections={preview?.sections}
            options={<DefinitionOptions definition={definition} answers={answers} onChange={setAnswers} />}
          />
        ) : (
          <Panel>
            <PanelHeader title="Preview" description="Pick at least one column to see the sheet." />
          </Panel>
        )}
      </div>
    </>
  );
}

export default ReportBuilder;
