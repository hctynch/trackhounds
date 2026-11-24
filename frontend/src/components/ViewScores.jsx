import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuClipboardList, LuPencil, LuTrash2 } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import { huntDays, isDualHunt, showsStake, STAKE_VIEWS } from '../lib/hunt';
import { formatTime } from '../lib/time';
import DogService from '../services/DogService';
import { Alert, Badge, Button, ConfirmDialog, EmptyState, Field, Input, PageHeader, Panel, PanelBody, SearchInput, SegmentedControl, Select, STAKE_LABELS, StakeBadge, useToast } from './ui';

const ORDERS = [
  { value: 'time', label: 'By cross time' },
  { value: 'entered', label: 'Last entered first' },
];

/**
 * Every cross of the hunt with its dogs grouped under it, the way the judge's card reads. A cross
 * is corrected or deleted as a whole: Edit opens it on the score entry page.
 */
function ViewScores() {
  const toast = useToast();
  const navigate = useNavigate();
  const { hunt } = useHunt();
  const dual = isDualHunt(hunt);
  const DAY_OPTIONS = [{ value: 'all', label: 'All days' }, ...huntDays(hunt).map((d) => ({ value: String(d), label: `Day ${d}` }))];
  const [search, setSearch] = useState('');
  const [day, setDay] = useState('all');
  const [judge, setJudge] = useState('');
  const [stakeView, setStakeView] = useState('ALL');
  const [order, setOrder] = useState('time');
  const [crosses, setCrosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    const response = await DogService.getCrosses();
    if (Array.isArray(response)) {
      setCrosses(response);
    } else {
      setCrosses([]);
      setError(response?.message || 'The scores could not be loaded.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, hunt]);

  useEffect(() => {
    if (!dual) setStakeView('ALL');
  }, [dual]);

  const confirmDelete = async () => {
    setDeleting(true);
    const response = await DogService.removeCross(pendingDelete.id);
    setDeleting(false);
    if (response) {
      toast.error(response.message || 'The cross could not be deleted.');
      return;
    }
    setCrosses((current) => current.filter((cross) => cross.id !== pendingDelete.id));
    toast.success(`Cross at ${formatTime(pendingDelete.time)} on day ${pendingDelete.day} deleted. Standings are recalculated.`);
    setPendingDelete(null);
  };

  const needle = search.trim();
  const matchesSearch = useCallback((score) => Boolean(needle) && String(score.dogNumber ?? '').includes(needle), [needle]);

  // A cross is listed when it passes every filter; with a stake chosen only that stake's dogs are
  // shown in it (their ladder), while a dog search shows the whole cross the dog was in.
  const visible = useMemo(() => {
    const judgeNumber = judge.trim();
    const listed = crosses
      .filter((cross) => day === 'all' || String(cross.day) === day)
      .filter((cross) => !judgeNumber || String(cross.judgeNumber) === judgeNumber)
      .map((cross) => (stakeView === 'ALL' ? cross : { ...cross, scores: cross.scores.filter((score) => score.stake === stakeView) }))
      .filter((cross) => cross.scores.length > 0)
      .filter((cross) => !needle || cross.scores.some(matchesSearch));
    return order === 'entered' ? [...listed].sort((a, b) => b.id - a.id) : listed;
  }, [crosses, day, judge, stakeView, needle, matchesSearch, order]);

  const scoreCount = visible.reduce((total, cross) => total + cross.scores.length, 0);
  const filtered = day !== 'all' || judge.trim() !== '' || needle !== '' || stakeView !== 'ALL';
  const summary = loading
    ? 'Loading'
    : `${visible.length} ${visible.length === 1 ? 'cross' : 'crosses'}, ${scoreCount} ${scoreCount === 1 ? 'score' : 'scores'}${judge.trim() ? `, judge ${judge.trim()}` : ''}${
        day !== 'all' ? `, day ${day}` : ''
      }${stakeView !== 'ALL' ? `, ${STAKE_LABELS[stakeView].toLowerCase()}` : ''}${needle ? `, dog ${needle}` : ''}`;

  const cell = 'px-4 py-2 align-middle';

  return (
    <>
      <PageHeader
        title="Scores"
        description="Every cross recorded in this hunt, with its dogs in crossing order. Counted scores are the highest in their interval. Edit opens a cross to correct its time, judge, dogs or points."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Find by dog number" className="w-56" />}
      />

      {error && (
        <Alert tone="danger" title={error} className="mb-6" />
      )}

      <Panel className="mb-6">
        <PanelBody className="flex flex-wrap items-end gap-4">
          <Field label="Day" className="w-36">
            {({ id }) => (
              <Select id={id} value={day} onChange={(event) => setDay(event.target.value)}>
                {DAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Judge number" className="w-36">
            {({ id }) => <Input id={id} type="number" numeric min={1} value={judge} onChange={(event) => setJudge(event.target.value)} placeholder="Every judge" />}
          </Field>
          {dual && (
            <Field label="Stake" className="w-40">
              {({ id }) => (
                <Select id={id} value={stakeView} onChange={(event) => setStakeView(event.target.value)}>
                  {STAKE_VIEWS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          <Field label="Order">
            <SegmentedControl label="Order" options={ORDERS} value={order} onChange={setOrder} />
          </Field>
          <p className="ml-auto pb-2 text-small text-ink-muted">{summary}</p>
        </PanelBody>
      </Panel>

      <Panel>
        {visible.length === 0 ? (
          <div className="px-4 py-10">
            {loading ? (
              <p className="text-center text-small text-ink-muted">Loading scores</p>
            ) : filtered ? (
              <EmptyState compact title="No crosses match" description="Change the day, judge, stake or dog number." />
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
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-body">
              <thead>
                <tr className="border-b border-line-strong text-small font-medium text-ink-muted">
                  <th scope="col" className="w-14 px-4 py-2.5 text-right font-medium">
                    Place
                  </th>
                  <th scope="col" className="w-20 px-4 py-2.5 text-right font-medium">
                    Dog
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">
                    Name
                  </th>
                  <th scope="col" className="w-24 px-4 py-2.5 text-right font-medium">
                    Points
                  </th>
                  <th scope="col" className="w-40 px-4 py-2.5 text-left font-medium">
                    Counted
                  </th>
                </tr>
              </thead>
              {visible.map((cross) => (
                <tbody key={cross.id} className="border-b border-line-strong last:border-b-0">
                  <tr className="bg-sunken">
                    <th scope="rowgroup" colSpan={5} className="px-4 py-2 text-left font-normal">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                        <span className="font-semibold text-ink">Day {cross.day}</span>
                        <span className="tabular font-semibold text-ink">{formatTime(cross.time)}</span>
                        <span className="text-ink">
                          Judge {cross.judgeNumber}
                          {cross.judgeName ? <span className="text-ink-muted">, {cross.judgeName}</span> : null}
                        </span>
                        <span className="text-small text-ink-muted">
                          {cross.scores.length} {cross.scores.length === 1 ? 'dog' : 'dogs'}
                          {stakeView !== 'ALL' ? `, ${STAKE_LABELS[stakeView].toLowerCase()} only` : ''}
                        </span>
                        <span className="ml-auto flex items-center gap-2">
                          <Button size="sm" icon={LuPencil} onClick={() => navigate(`/score-entry/view/${cross.id}`, { state: { from: '/score-entry/view' } })}>
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" icon={LuTrash2} onClick={() => setPendingDelete(cross)} aria-label={`Delete the cross at ${formatTime(cross.time)} on day ${cross.day}`}>
                            Delete
                          </Button>
                        </span>
                      </div>
                    </th>
                  </tr>
                  {cross.scores.map((score) => (
                    <tr key={score.id} className={`border-t border-line ${matchesSearch(score) ? 'bg-brass-100/50' : ''} ${score.counted ? '' : 'text-ink-muted'}`}>
                      <td className={`${cell} text-right font-serif text-[15px] text-ink-faint tabular`}>{score.position}</td>
                      <td className={`${cell} text-right font-semibold tabular`}>{score.dogNumber}</td>
                      <td className={cell}>
                        {score.dogName ? (
                          <span className="inline-flex items-center gap-2">
                            <span>{score.dogName}</span>
                            {showsStake(hunt, score.stake) && (stakeView === 'ALL' || score.stake !== stakeView) && <StakeBadge stake={score.stake} />}
                            {score.scratched && <Badge tone="warning">Scratched</Badge>}
                          </span>
                        ) : (
                          <span className="text-ink-faint">Not registered</span>
                        )}
                      </td>
                      <td className={`${cell} text-right font-semibold tabular`}>{score.points}</td>
                      <td className={cell}>
                        {score.counted ? (
                          <span className="text-success-700">Yes</span>
                        ) : (
                          <span className="text-ink-faint" title="A higher cross of this dog in the same scoring interval counts instead.">
                            No, interval {score.interval}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        busy={deleting}
        danger
        title="Delete this cross?"
        description={
          pendingDelete
            ? `Day ${pendingDelete.day}, ${formatTime(pendingDelete.time)}, judge ${pendingDelete.judgeNumber}: ${
                crosses.find((cross) => cross.id === pendingDelete.id)?.scores.length ?? pendingDelete.scores.length
              } dog scores are removed and the standings are recalculated. To take one dog out, edit the cross instead.`
            : ''
        }
        confirmLabel="Delete cross"
      />
    </>
  );
}

export default ViewScores;
