import { useEffect, useState } from 'react';
import { LuPencil, LuPlus, LuTrophy } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import DogService from '../services/DogService';
import JudgeService from '../services/JudgeService';
import { Button, DataTable, EmptyState, PageHeader, Panel, PanelHeader, STAKE_LABELS, SegmentedControl } from './ui';

const DAYS = [1, 2, 3, 4].map((day) => ({ value: day, label: `Day ${day}` }));

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
  const [overall, setOverall] = useState([]);
  const [daily, setDaily] = useState([]);
  const [day, setDay] = useState(1);

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
      setOverall(Array.isArray(top) ? top : []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [hunt]);

  useEffect(() => {
    let cancelled = false;
    DogService.getTop10ScoringDogsByDay(day).then((data) => {
      if (!cancelled) setDaily(Array.isArray(data) ? data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [day, hunt]);

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

  const overallColumns = [
    { key: 'rank', header: '', width: '3rem', align: 'right', render: (row, index) => <Rank rank={index + 1} /> },
    { key: 'dogNumber', header: 'Dog', numeric: true, width: '4.5rem' },
    { key: 'dogName', header: 'Name', render: (row) => <span className="font-medium">{row.dogName}</span> },
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
    { key: 'dogName', header: 'Name', render: (row) => <span className="font-medium">{row.dogName}</span> },
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
            <Button variant="primary" icon={LuPlus} onClick={() => navigate('/hunt/create')}>
              New hunt
            </Button>
          </>
        }
      />

      <Panel className="mb-6 grid grid-cols-2 divide-x divide-line md:grid-cols-4">
        <Fact label="Dogs registered" value={dogTotal} />
        <Fact label="Judges" value={judgeTotal} />
        <Fact label="Stake" value={STAKE_LABELS[hunt?.stake] || 'Not set'} />
        <Fact label="Point interval" value={hunt?.huntInterval ?? 0} />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Overall standings" description="Top ten across all days, including endurance" />
          <DataTable
            columns={overallColumns}
            rows={overall}
            rowKey={(row) => row.dogNumber}
            empty={
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
            }
          />
        </Panel>

        <Panel>
          <PanelHeader
            title="Daily standings"
            description="Speed and drive for the day, plus endurance"
            actions={<SegmentedControl size="sm" label="Day" options={DAYS} value={day} onChange={setDay} />}
          />
          <DataTable
            columns={dailyColumns}
            rows={dailyRows}
            rowKey={(row) => row.dogNumber}
            empty={<EmptyState compact title={`No scores for day ${day}`} description="Enter crosses for this day to see its standings." />}
          />
        </Panel>
      </div>
    </>
  );
}

export default Home;
