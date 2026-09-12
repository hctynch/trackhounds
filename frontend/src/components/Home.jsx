import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { LuCircle, LuCircleCheck, LuPencil, LuPlus, LuTrophy } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import { dayOptions, isDualHunt, showsStake, STAKE_VIEWS } from '../lib/hunt';
import DataService from '../services/DataService';
import DogService from '../services/DogService';
import JudgeService from '../services/JudgeService';
import { Badge, Button, DataTable, Dialog, EmptyState, PageHeader, Panel, PanelHeader, STAKE_LABELS, SegmentedControl, StakeBadge, useToast } from './ui';

/** The top ten for one stake view: every dog, or one stake of a dual hunt. */
const fetchOverall = (stakeView) => (stakeView === 'ALL' ? DogService.getTop10ScoringDogsOverall() : DogService.getTop10ScoringDogsByStakeType(stakeView));
const fetchDaily = (day, stakeView) =>
  stakeView === 'ALL' ? DogService.getTop10ScoringDogsByDay(day) : DogService.getTop10ScoringDogsByDayAndStakeType(day, stakeView);

/** The setup steps of a hunt, shown until every one is done. */
function SetupChecklist({ judges, dogs, scored }) {
  const steps = [
    { label: 'Create the hunt', done: true },
    { label: judges > 0 ? `${judges} ${judges === 1 ? 'judge' : 'judges'} added` : 'Add the judges', done: judges > 0, to: '/judges/all' },
    { label: dogs > 0 ? `${dogs} ${dogs === 1 ? 'dog' : 'dogs'} registered` : 'Register the dogs', done: dogs > 0, to: '/dogs/add' },
    { label: scored ? 'First cross entered' : 'Enter the first cross', done: scored, to: '/score-entry/enter' },
  ];
  const next = steps.find((step) => !step.done);
  return (
    <Panel className="mb-6">
      <PanelHeader
        title="Getting this hunt ready"
        description="In this order. The next step is highlighted."
        actions={
          <Link to="/docs" className="text-small font-medium text-pine-700 hover:underline">
            Quick start guide
          </Link>
        }
      />
      <ol className="divide-y divide-line">
        {steps.map((step) => {
          const isNext = step === next;
          const Icon = step.done ? LuCircleCheck : LuCircle;
          return (
            <li key={step.label} className={`flex items-center gap-3 px-5 py-2.5 ${isNext ? 'bg-brass-100/60' : ''}`}>
              <Icon size={18} className={step.done ? 'text-success-600' : isNext ? 'text-brass-500' : 'text-ink-faint'} aria-hidden />
              <span className={`flex-1 ${step.done ? 'text-ink-muted' : 'font-medium text-ink'}`}>{step.label}</span>
              {isNext && step.to && (
                <Link to={step.to} className="text-small font-medium text-pine-700 hover:underline">
                  Go
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

SetupChecklist.propTypes = {
  judges: PropTypes.number.isRequired,
  dogs: PropTypes.number.isRequired,
  scored: PropTypes.bool.isRequired,
};

/** A dog's name with its stake tag (when the stake is not obvious from the list) and a scratched mark. */
function DogName({ dog, tagged = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-medium">{dog.dogName}</span>
      {tagged && <StakeBadge stake={dog.stake} />}
      {dog.scratched && <Badge tone="warning">Scratched</Badge>}
    </span>
  );
}

DogName.propTypes = {
  dog: (props, propName) => (props[propName] && typeof props[propName] === 'object' ? null : new Error('dog is required')),
  tagged: PropTypes.bool,
};


function Rank({ rank }) {
  return (
    <span className={`tabular font-serif text-[17px] ${rank === 1 ? 'font-semibold text-brass-500' : 'text-ink-muted'}`}>{rank}</span>
  );
}

Rank.propTypes = { rank: (props, propName) => (typeof props[propName] === 'number' ? null : new Error('rank must be a number')) };

function Fact({ label, value }) {
  return (
    <div className="px-5 py-4">
      <p className="text-small text-ink-muted">{label}</p>
      <p className="mt-0.5 text-title font-semibold tabular text-ink">{value}</p>
    </div>
  );
}

Fact.propTypes = {
  label: (props, propName) => (typeof props[propName] === 'string' ? null : new Error('label must be a string')),
  value: () => null,
};

function Home() {
  const navigate = useNavigate();
  const { hunt, loading } = useHunt();
  const [dogTotal, setDogTotal] = useState(0);
  const [judgeTotal, setJudgeTotal] = useState(0);
  const [scored, setScored] = useState(false);
  const [overall, setOverall] = useState([]);
  const [daily, setDaily] = useState([]);
  const [day, setDay] = useState(1);
  const [stakeView, setStakeView] = useState('ALL');
  const dual = isDualHunt(hunt);
  const [confirmNewHunt, setConfirmNewHunt] = useState(false);
  const [archiveFirst, setArchiveFirst] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const toast = useToast();

  const startNewHunt = async () => {
    if (archiveFirst) {
      setArchiving(true);
      const result = await DataService.archiveCurrentHunt();
      setArchiving(false);
      if (!result || !result.file) {
        toast.error(result?.message || 'The hunt could not be saved to past hunts.');
        return;
      }
      toast.success(`"${hunt?.title}" saved to past hunts.`);
    }
    setConfirmNewHunt(false);
    navigate('/hunt/create');
  };

  // Only a dual hunt has stake views; a hunt of one stake always shows every dog.
  useEffect(() => {
    if (!dual) setStakeView('ALL');
  }, [dual]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [dogs, judges, top] = await Promise.all([
        DogService.getDogTotal(),
        JudgeService.getJudgeTotal(),
        DogService.getTop10ScoringDogsOverall(),
      ]);
      if (cancelled) return;
      setDogTotal(typeof dogs === 'number' ? dogs : 0);
      setJudgeTotal(typeof judges === 'number' ? judges : 0);
      setScored(Array.isArray(top) && top.length > 0);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [hunt]);

  useEffect(() => {
    let cancelled = false;
    fetchOverall(stakeView).then((data) => {
      if (!cancelled) setOverall(Array.isArray(data) ? data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [stakeView, hunt]);

  useEffect(() => {
    let cancelled = false;
    fetchDaily(day, stakeView).then((data) => {
      if (!cancelled) setDaily(Array.isArray(data) ? data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [day, stakeView, hunt]);

  if (!loading && !hunt) {
    return (
      <>
        <PageHeader title="Welcome to TrackHounds" description="Set up a hunt to start registering dogs, judges and scores." />
        <Panel>
          <EmptyState
            icon={LuTrophy}
            title="No hunt yet"
            description="Everything in TrackHounds belongs to one hunt at a time. Create the hunt first, then add dogs and judges."
            action={
              <Button variant="primary" icon={LuPlus} onClick={() => navigate('/hunt/create')}>
                Create a hunt
              </Button>
            }
          />
        </Panel>
      </>
    );
  }

  // A tag says which competition a dog is in when the list does not already: both stakes of a
  // dual hunt together, or a dog whose stake differs from the hunt's.
  const tagged = (row) => showsStake(hunt, row.stake) && (stakeView === 'ALL' || row.stake !== stakeView);
  const stakeNoun = stakeView === 'ALL' ? '' : ` ${STAKE_LABELS[stakeView].toLowerCase()} dogs`;

  const overallColumns = [
    { key: 'rank', header: '', width: '3rem', align: 'right', render: (row, index) => <Rank rank={index + 1} /> },
    { key: 'dogNumber', header: 'Dog', numeric: true, width: '4.5rem' },
    { key: 'dogName', header: 'Name', render: (row) => <DogName dog={row} tagged={tagged(row)} /> },
    { key: 'owner', header: 'Owner', cellClassName: 'text-ink-muted' },
    { key: 'totalPoints', header: 'Points', numeric: true, cellClassName: 'font-semibold', width: '5.5rem' },
  ];

  const dailyRows = daily.map((dog) => {
    const endurance = dog.endurance ?? Math.floor((dog.totalPoints * day) / 10);
    return { ...dog, endurance, total: dog.dayTotal ?? dog.totalPoints + endurance };
  });

  const dailyColumns = [
    { key: 'rank', header: '', width: '3rem', align: 'right', render: (row, index) => <Rank rank={index + 1} /> },
    { key: 'dogNumber', header: 'Dog', numeric: true, width: '4.5rem' },
    { key: 'dogName', header: 'Name', render: (row) => <DogName dog={row} tagged={tagged(row)} /> },
    { key: 'totalPoints', header: 'S&D', numeric: true, width: '4.5rem' },
    { key: 'endurance', header: 'Endurance', numeric: true, width: '6rem' },
    { key: 'total', header: 'Total', numeric: true, cellClassName: 'font-semibold', width: '5rem' },
  ];

  return (
    <>
      <PageHeader
        title={hunt?.title || 'Hunt'}
        description={hunt?.dates}
        actions={
          <>
            <Button icon={LuPencil} onClick={() => navigate('/hunt/edit')}>
              Edit hunt
            </Button>
            <Button variant="primary" icon={LuPlus} onClick={() => setConfirmNewHunt(true)}>
              New hunt
            </Button>
          </>
        }
      />

      <Dialog
        open={confirmNewHunt}
        onClose={() => setConfirmNewHunt(false)}
        size="sm"
        title={`Replace "${hunt?.title}"?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmNewHunt(false)} disabled={archiving}>
              Cancel
            </Button>
            <Button variant={archiveFirst ? 'primary' : 'danger'} onClick={startNewHunt} loading={archiving}>
              {archiveFirst ? 'Save and continue' : 'Continue without saving'}
            </Button>
          </>
        }
      >
        <p className="text-body text-ink-muted">
          TrackHounds keeps one hunt at a time. Creating a new hunt replaces this hunt&apos;s dogs, judges, scores and scratches.
        </p>
        <label className="mt-4 flex items-start gap-3 rounded-md border border-line bg-sunken px-3.5 py-3 text-body">
          <input type="checkbox" className="mt-1" checked={archiveFirst} onChange={(event) => setArchiveFirst(event.target.checked)} />
          <span>
            <span className="font-medium">Save this hunt to past hunts first</span>
            <span className="mt-0.5 block text-small text-ink-muted">It can be opened again later from the Backups page. Uncheck only if you no longer need it.</span>
          </span>
        </label>
      </Dialog>

      {(judgeTotal === 0 || dogTotal === 0 || !scored) && <SetupChecklist judges={judgeTotal} dogs={dogTotal} scored={scored} />}

      <Panel className="mb-6 grid grid-cols-2 divide-x divide-line md:grid-cols-5">
        <Fact label="Dogs registered" value={dogTotal} />
        <Fact label="Judges" value={judgeTotal} />
        <Fact label="Stake" value={STAKE_LABELS[hunt?.stake] || 'Not set'} />
        <Fact label="Scoring interval" value={`${hunt?.huntInterval ?? 0} min`} />
        <Fact label="Point step" value={hunt?.pointStep ?? 5} />
      </Panel>

      {dual && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <SegmentedControl size="sm" label="Stake" options={STAKE_VIEWS} value={stakeView} onChange={setStakeView} />
          <p className="text-small text-ink-muted">All age and derby dogs are placed separately in a dual hunt. Both stakes lists them together, each tagged with its stake.</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Overall standings" description={`Top ten${stakeNoun} across all days, including endurance`} />
          <DataTable
            columns={overallColumns}
            rows={overall}
            rowKey={(row) => row.dogNumber}
            empty={
              stakeView === 'ALL' ? (
                <EmptyState
                  compact
                  title="No scores yet"
                  description="Standings appear as soon as the first cross is entered."
                  action={
                    <Link to="/score-entry/enter" className="text-small font-medium text-pine-700 hover:underline">
                      Enter scores
                    </Link>
                  }
                />
              ) : (
                <EmptyState compact title={`No${stakeNoun} have scored yet`} description="Standings for this stake appear as soon as one of its dogs is in a cross." />
              )
            }
          />
        </Panel>

        <Panel>
          <PanelHeader
            title="Daily standings"
            description={`Speed and drive${stakeNoun ? ` of${stakeNoun}` : ''} for the day, plus endurance`}
            actions={<SegmentedControl size="sm" label="Day" options={dayOptions(hunt)} value={day} onChange={setDay} />}
          />
          <DataTable
            columns={dailyColumns}
            rows={dailyRows}
            rowKey={(row) => row.dogNumber}
            empty={<EmptyState compact title={`No${stakeNoun || ' scores'} for day ${day}`} description="Enter crosses for this day to see its standings." />}
          />
        </Panel>
      </div>
    </>
  );
}

export default Home;
