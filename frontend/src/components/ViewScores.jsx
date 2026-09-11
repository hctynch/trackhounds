import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuClipboardList, LuTrash2 } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import { huntDays } from '../lib/hunt';
import DogService from '../services/DogService';
import { Alert, ConfirmDialog, DataTable, EmptyState, Field, IconButton, Input, PageHeader, Panel, PanelBody, SearchInput, Select, useToast } from './ui';


function ViewScores() {
  const toast = useToast();
  const { hunt } = useHunt();
  const DAY_OPTIONS = [{ value: 'all', label: 'All days' }, ...huntDays(hunt).map((d) => ({ value: String(d), label: `Day ${d}` }))];
  const [search, setSearch] = useState('');
  const [day, setDay] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      const dayNumber = day === 'all' ? null : parseInt(day, 10);
      if (filterType === 'all') {
        response = dayNumber ? await DogService.getScoresByDay(dayNumber) : await DogService.getScores();
      } else {
        if (!filterValue) {
          setScores([]);
          setLoading(false);
          return;
        }
        const number = parseInt(filterValue, 10);
        if (filterType === 'dog') {
          response = dayNumber ? await DogService.getScoresByDogNumberAndDay(number, dayNumber) : await DogService.getScoresByDogNumber(number);
        } else {
          response = dayNumber ? await DogService.getScoresByJudgeNumberAndDay(number, dayNumber) : await DogService.getScoresByJudgeNumber(number);
        }
      }
      if (response && response.message && response.fields) {
        setError({ message: response.message, fields: response.fields });
        setScores([]);
      } else {
        setScores(Array.isArray(response) ? response : []);
      }
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError({ message: 'The scores could not be loaded.' });
      setScores([]);
    } finally {
      setLoading(false);
    }
  }, [day, filterType, filterValue]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const confirmDelete = async () => {
    setDeleting(true);
    const response = await DogService.deleteCross(pendingDelete.dogNumber, pendingDelete.id);
    setDeleting(false);
    if (response && (response.error || response.message)) {
      toast.error(response.message || response.error);
      return;
    }
    setScores((current) => current.filter((score) => score.id !== pendingDelete.id));
    toast.success(`Score for dog ${pendingDelete.dogNumber} at ${pendingDelete.time} deleted.`);
    setPendingDelete(null);
  };

  const visible = useMemo(
    () => (search ? scores.filter((score) => score.dogNumber?.toString().includes(search.trim())) : scores),
    [scores, search],
  );

  const fieldError = (name) => error?.fields?.[name];

  const columns = [
    { key: 'day', header: 'Day', numeric: true, width: '4rem' },
    { key: 'time', header: 'Cross time', width: '7rem', cellClassName: 'tabular' },
    { key: 'judgeNumber', header: 'Judge', numeric: true, width: '5rem' },
    { key: 'dogNumber', header: 'Dog', numeric: true, width: '5rem', cellClassName: 'font-semibold' },
    { key: 'points', header: 'Points', numeric: true, width: '5rem', cellClassName: 'font-semibold' },
    {
      key: 'counted',
      header: 'Counted',
      render: (score) => (score.counted ? <span className="text-success-700">Yes</span> : <span className="text-ink-faint">No</span>),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '3.5rem',
      render: (score) => <IconButton icon={LuTrash2} label="Delete score" tone="danger" onClick={() => setPendingDelete(score)} />,
    },
  ];

  const summary = loading
    ? 'Loading'
    : `${visible.length} ${visible.length === 1 ? 'score' : 'scores'}${filterType !== 'all' ? `, ${filterType} ${filterValue || '?'}` : ''}${day !== 'all' ? `, day ${day}` : ''}`;

  return (
    <>
      <PageHeader
        title="Scores"
        description="Every cross recorded in this hunt. Counted scores are the highest in their interval."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Find by dog number" className="w-56" />}
      />

      {error?.message && (
        <Alert tone="danger" title={error.message} className="mb-6" items={error.fields ? Object.values(error.fields) : undefined} />
      )}

      <Panel className="mb-6">
        <PanelBody className="flex flex-wrap items-end gap-4">
          <Field label="Show" className="w-44">
            {({ id }) => (
              <Select
                id={id}
                value={filterType}
                onChange={(event) => {
                  setFilterType(event.target.value);
                  setFilterValue('');
                }}
              >
                <option value="all">All scores</option>
                <option value="dog">One dog</option>
                <option value="judge">One judge</option>
              </Select>
            )}
          </Field>
          {filterType !== 'all' && (
            <Field label={filterType === 'dog' ? 'Dog number' : 'Judge number'} className="w-40" error={fieldError(filterType === 'dog' ? 'dogNumber' : 'judgeNumber')}>
              {({ id, invalid }) => (
                <Input id={id} type="number" numeric min={1} invalid={invalid} value={filterValue} onChange={(event) => setFilterValue(event.target.value)} autoFocus />
              )}
            </Field>
          )}
          <Field label="Day" className="w-36" error={fieldError('day')}>
            {({ id, invalid }) => (
              <Select id={id} invalid={invalid} value={day} onChange={(event) => setDay(event.target.value)}>
                {DAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <p className="ml-auto pb-2 text-small text-ink-muted">{summary}</p>
        </PanelBody>
      </Panel>

      <Panel>
        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(score) => score.id}
          stickyHeader
          empty={
            loading ? (
              <p className="text-center text-small text-ink-muted">Loading scores</p>
            ) : filterType !== 'all' && !filterValue ? (
              <EmptyState compact title={`Enter a ${filterType} number`} description="Scores appear as soon as a number is entered." />
            ) : filterType !== 'all' || day !== 'all' || search ? (
              <EmptyState compact title="No scores match" description="Change the day or the number, or clear the search." />
            ) : (
              <EmptyState
                icon={LuClipboardList}
                title="No scores recorded"
                description="Crosses entered on the scoring page appear here."
                action={
                  <Link to="/score-entry/enter" className="text-small font-medium text-pine-700 hover:underline">
                    Enter scores
                  </Link>
                }
              />
            )
          }
        />
      </Panel>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        busy={deleting}
        danger
        title="Delete this score?"
        description={pendingDelete ? `Dog ${pendingDelete.dogNumber}, ${pendingDelete.points} points at ${pendingDelete.time} on day ${pendingDelete.day}. Standings are recalculated.` : ''}
        confirmLabel="Delete score"
      />
    </>
  );
}

export default ViewScores;
