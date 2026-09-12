import { useCallback, useEffect, useRef, useState } from 'react';
import { LuPlus, LuTriangleAlert } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import { dayOptions, showsStake, stakeForNumber } from '../lib/hunt';
import DogService from '../services/DogService';
import {
  Alert,
  Button,
  CellInput,
  Dialog,
  Field,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
  STAKE_LABELS,
  SegmentedControl,
  StakeBadge,
  useToast,
} from './ui';

const MIN_ROWS = 7;
const REGISTER_STAKES = ['ALL_AGE', 'DERBY'].map((value) => ({ value, label: STAKE_LABELS[value] }));

const isDogNumber = (value) => /^[0-9]{1,6}$/.test(String(value ?? "").trim());
const filled = (count, value) => Array.from({ length: count }, () => value);

/**
 * The page scorekeepers live on. Everything is reachable with arrow keys and Enter, the points
 * for each dog are worked out as numbers are typed so the judge can check them, and a dog that is
 * not registered can be registered on the spot or skipped.
 */
function ScoreEntry() {
  const toast = useToast();
  const { hunt, loading: huntLoading } = useHunt();
  const huntExists = Boolean(hunt);
  const huntType = hunt?.stake || 'ALL_AGE';
  const scoringInterval = hunt?.huntInterval ?? 0;

  const [selectedDay, setSelectedDay] = useState(1);
  const [rows, setRows] = useState(MIN_ROWS);
  const [dogs, setDogs] = useState(filled(MIN_ROWS, ''));
  const [customPoints, setCustomPoints] = useState(filled(MIN_ROWS, null));
  const [dogErrors, setDogErrors] = useState(filled(MIN_ROWS, false));
  const [dogStakes, setDogStakes] = useState(filled(MIN_ROWS, null));
  const [skipped, setSkipped] = useState(filled(MIN_ROWS, false));
  const [startingPoints, setStartingPoints] = useState(35);
  const [interval, setInterval] = useState(5);
  const [startTime, setStartTime] = useState('');
  const [dayStarted, setDayStarted] = useState(false);
  const [judge, setJudge] = useState('');
  const [crossTime, setCrossTime] = useState('');
  const [error, setError] = useState({});
  const [saving, setSaving] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [recent, setRecent] = useState([]); // last crosses of the selected day, newest first
  const [dogsByNumber, setDogsByNumber] = useState({}); // registered dogs, for the stake tags on recent crosses

  // Reloaded after every save and registration, so a dog registered from the cross has its tag at once.
  useEffect(() => {
    if (!huntExists) return;
    DogService.getDogs().then((list) => {
      const byNumber = {};
      (Array.isArray(list) ? list : []).forEach((dog) => {
        byNumber[String(dog.number)] = dog;
      });
      setDogsByNumber(byNumber);
    });
  }, [huntExists, refreshTick]);

  useEffect(() => {
    if (!huntExists) return;
    DogService.getScoresByDay(selectedDay).then((scores) => {
      if (!Array.isArray(scores)) {
        setRecent([]);
        return;
      }
      // Group the day's scores into crosses (same judge and time), newest first.
      const groups = new Map();
      scores.forEach((score) => {
        const key = `${score.judgeNumber}@${score.time}`;
        if (!groups.has(key)) groups.set(key, { key, judge: score.judgeNumber, time: score.time, dogs: [] });
        groups.get(key).dogs.push(score);
      });
      setRecent(Array.from(groups.values()).sort((a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : 0)));
    });
  }, [selectedDay, huntExists, refreshTick]);

  const judgesLastCross = judge ? recent.find((group) => String(group.judge) === String(judge)) : null;
  const crossTimeSeconds = crossTime ? `${crossTime}${crossTime.length === 5 ? ':00' : ''}` : '';
  const earlierThanLast = Boolean(judgesLastCross && crossTimeSeconds && crossTimeSeconds < judgesLastCross.time);

  // Register-on-the-spot dialog
  const [registering, setRegistering] = useState(null); // row index
  const [registerValues, setRegisterValues] = useState({ name: '', owner: '', sire: '', dam: '', stake: 'ALL_AGE' });
  const [registerErrors, setRegisterErrors] = useState({});
  const [registerSaving, setRegisterSaving] = useState(false);

  // Change-start-time dialog
  const [changingStart, setChangingStart] = useState(false);
  const [newStart, setNewStart] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeSaving, setChangeSaving] = useState(false);

  const inputRefs = useRef({});
  const debounceTimerRef = useRef(null);
  const resetFlagRef = useRef(false);

  useEffect(() => {
    if (!hunt) return;
    if (typeof hunt.pointStep === 'number') setInterval(hunt.pointStep);
    if (typeof hunt.firstDogPoints === 'number') setStartingPoints(hunt.firstDogPoints);
  }, [hunt]);

  useEffect(() => {
    if (!huntExists) return;
    DogService.getStartTime(selectedDay).then((result) => {
      setError((current) => ({ ...current, startTime: undefined }));
      if (result instanceof Error || !result) {
        setStartTime('');
        setDayStarted(false);
      } else {
        setStartTime(result);
        setDayStarted(true);
      }
    });
  }, [selectedDay, huntExists, refreshTick]);

  const updateCrossInfo = useCallback(() => {
    if (!huntExists || resetFlagRef.current) return;
    const validDogs = dogs.filter((dog) => isDogNumber(dog));
    if (validDogs.length === 0) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      if (resetFlagRef.current) return;
      try {
        const crossInfo = await DogService.getCrossInfo(dogs, startingPoints, interval, huntType);
        if (resetFlagRef.current || !crossInfo || crossInfo.length === 0) return;
        const infoByDog = {};
        crossInfo.forEach((info) => {
          infoByDog[info.dogNumber] = info;
        });
        const nextPoints = [...customPoints];
        const nextErrors = filled(rows, false);
        const nextStakes = [...dogStakes];
        dogs.forEach((dog, index) => {
          if (dog && dog.toString().trim() !== '') {
            const info = infoByDog[String(dog).trim()];
            if (info && !info.error) {
              nextStakes[index] = info.scratched ? `${info.stake}:scratched` : info.stake;
              if (nextPoints[index] === null) nextPoints[index] = info.points;
            } else {
              nextErrors[index] = `Dog ${dog} is not registered in this hunt.`;
              nextStakes[index] = null;
            }
          } else {
            nextStakes[index] = null;
          }
        });
        setDogErrors(nextErrors);
        setCustomPoints(nextPoints);
        setDogStakes(nextStakes);
      } catch (err) {
        console.error('Error updating cross info:', err);
      }
    }, 400);
  }, [dogs, startingPoints, interval, huntType, customPoints, huntExists, dogStakes, rows, refreshTick]);

  useEffect(() => {
    updateCrossInfo();
  }, [dogs, startingPoints, interval, refreshTick, updateCrossInfo]);

  const setAt = (setter) => (index, value) => setter((current) => current.map((entry, i) => (i === index ? value : entry)));
  const setDogAt = setAt(setDogs);
  const setPointsAt = setAt(setCustomPoints);
  const setErrorAt = setAt(setDogErrors);
  const setStakeAt = setAt(setDogStakes);
  const setSkippedAt = setAt(setSkipped);

  const handleDogChange = (index, value) => {
    setDogAt(index, value);
    setSkippedAt(index, false);
    if (!value) {
      setPointsAt(index, null);
      setErrorAt(index, false);
      setStakeAt(index, null);
    }
  };

  const handleCustomPointsChange = (index, value) => setPointsAt(index, value === '' ? null : Number(value));

  // Positions stand: a skipped row still occupies its place in the cross.
  const calculatePoints = (index) => {
    if (customPoints[index] !== null) return customPoints[index];
    const present = dogs.filter((dog) => dog && dog.trim() !== '');
    const position = present.findIndex((dog) => dog === dogs[index]);
    if (dogs[index] && position !== -1) return Math.max(0, startingPoints - position * interval);
    return Math.max(0, startingPoints - index * interval);
  };

  const addRow = () => {
    const next = rows + 1;
    setRows(next);
    setDogs((current) => [...current, '']);
    setCustomPoints((current) => [...current, null]);
    setDogErrors((current) => [...current, false]);
    setDogStakes((current) => [...current, null]);
    setSkipped((current) => [...current, false]);
    setTimeout(() => inputRefs.current[`dog-${next - 1}`]?.focus(), 0);
  };

  // Arrow-key map between fields. Returns true when the key was handled.
  const handleKeyDown = (event, fieldId) => {
    const last = rows - 1;
    const map = {
      'day-1': { ArrowRight: 'day-2', ArrowDown: 'startTime' },
      'day-2': { ArrowLeft: 'day-1', ArrowRight: 'day-3', ArrowDown: 'startTime' },
      'day-3': { ArrowLeft: 'day-2', ArrowRight: 'day-4', ArrowDown: 'startTime' },
      'day-4': { ArrowLeft: 'day-3', ArrowDown: 'startTime' },
      startTime: { ArrowUp: 'day-1', ArrowDown: 'crossTime' },
      crossTime: { ArrowUp: 'startTime', ArrowDown: 'judge' },
      judge: { ArrowUp: 'crossTime', ArrowDown: 'startingPoints', ArrowRight: 'dog-0' },
      startingPoints: { ArrowUp: 'judge', ArrowRight: 'interval', ArrowDown: 'dog-0' },
      interval: { ArrowUp: 'judge', ArrowLeft: 'startingPoints', ArrowDown: 'dog-0' },
      resetButton: { ArrowUp: `points-${last}`, ArrowLeft: 'submitButton' },
      submitButton: { ArrowUp: `points-${last}`, ArrowRight: 'resetButton' },
    };
    for (let i = 0; i < rows; i += 1) {
      map[`dog-${i}`] = {
        ArrowUp: i === 0 ? 'interval' : `dog-${i - 1}`,
        ArrowRight: `points-${i}`,
        ArrowDown: i === last ? 'submitButton' : `dog-${i + 1}`,
        Enter: 'submitButton',
      };
      map[`points-${i}`] = {
        ArrowUp: i === 0 ? 'interval' : `points-${i - 1}`,
        ArrowLeft: `dog-${i}`,
        ArrowDown: i === last ? 'submitButton' : `points-${i + 1}`,
        Enter: 'submitButton',
      };
    }
    const next = map[fieldId]?.[event.key];
    if (!next) return false;
    event.preventDefault();
    const target = inputRefs.current[next];
    if (target) {
      target.focus();
      if (next.startsWith('day-')) setSelectedDay(parseInt(next.split('-')[1], 10));
    }
    return true;
  };

  const resetForm = () => {
    resetFlagRef.current = true;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setRows(MIN_ROWS);
    setStartingPoints(hunt?.firstDogPoints ?? 35);
    setInterval(hunt?.pointStep ?? 5);
    setCustomPoints(filled(MIN_ROWS, null));
    setCrossTime('');
    // The judge is kept: one judge usually reports several crosses in a row.
    setDogs(filled(MIN_ROWS, ''));
    setDogErrors(filled(MIN_ROWS, false));
    setDogStakes(filled(MIN_ROWS, null));
    setSkipped(filled(MIN_ROWS, false));
    setError({});
    setTimeout(() => {
      resetFlagRef.current = false;
      inputRefs.current.crossTime?.focus();
    }, 50);
  };

  const handleSubmit = async () => {
    if (!huntExists) return;
    const unresolved = dogs.findIndex((dog, index) => dog && dogErrors[index] && !skipped[index]);
    const badFormat = dogs.findIndex((dog) => dog && dog.trim() !== "" && !isDogNumber(dog));
    if (badFormat !== -1) {
      setError((current) => ({ ...current, general: `Dog number "${dogs[badFormat]}" is not valid: digits only, for example 12 or 007.` }));
      return;
    }
    if (unresolved !== -1) {
      setError((current) => ({ ...current, general: `Dog ${dogs[unresolved]} is not registered. Register it or skip it before saving.` }));
      return;
    }
    const included = dogs.map((dog, index) => ({ dog, index })).filter(({ dog, index }) => isDogNumber(dog) && !skipped[index]);
    if (included.length === 0) {
      setError((current) => ({ ...current, general: 'Enter at least one dog number.' }));
      return;
    }
    setSaving(true);
    const result = await DogService.postCross({
      day: selectedDay,
      startTime,
      judge: Number(judge),
      crossTime,
      dogNumbers: included.map(({ dog }) => dog.trim()),
      scores: included.map(({ index }) => calculatePoints(index)),
      // Buckets use the hunt's scoring interval; the server reads it from the hunt.
      interval: scoringInterval,
    });
    setSaving(false);
    if (result) {
      setError(result.fields || { general: result.message || 'The cross could not be saved.' });
      return;
    }
    const skippedCount = skipped.filter((entry, index) => entry && dogs[index]).length;
    toast.success(`Cross at ${crossTime} saved for day ${selectedDay}${skippedCount ? `, ${skippedCount} dog skipped` : ''}.`);
    setRefreshTick((tick) => tick + 1);
    resetForm();
  };

  // Register a dog straight from the cross.
  const openRegister = (index) => {
    const number = parseInt(dogs[index], 10);
    setRegisterValues({ name: '', owner: '', sire: '', dam: '', stake: stakeForNumber(hunt, number) || 'ALL_AGE' });
    setRegisterErrors({});
    setRegistering(index);
  };
  const setRegisterValue = (field) => (event) => setRegisterValues((current) => ({ ...current, [field]: event.target.value }));
  const saveRegistration = async (event) => {
    event.preventDefault();
    const found = {};
    if (!registerValues.name.trim()) found.name = 'Give the dog a name.';
    if (!registerValues.owner.trim()) found.owner = 'Enter the owner.';
    setRegisterErrors(found);
    if (Object.keys(found).length > 0) return;
    const number = dogs[registering].trim();
    setRegisterSaving(true);
    const result = await DogService.createDogs([{ number, ...registerValues, name: registerValues.name.trim(), owner: registerValues.owner.trim() }]);
    setRegisterSaving(false);
    if (result && result.fields) {
      setRegisterErrors({ name: Object.values(result.fields).join(' ') });
      return;
    }
    if (result && result.message) {
      setRegisterErrors({ name: result.message });
      return;
    }
    toast.success(`Dog ${number} registered.`);
    setErrorAt(registering, false);
    setSkippedAt(registering, false);
    setRegistering(null);
    setRefreshTick((tick) => tick + 1);
  };

  const openChangeStart = () => {
    setNewStart(startTime);
    setChangeError('');
    setChangingStart(true);
  };
  const saveStartTime = async (event) => {
    event.preventDefault();
    setChangeSaving(true);
    const result = await DogService.changeStartTime(selectedDay, newStart);
    setChangeSaving(false);
    if (typeof result === 'string') {
      setStartTime(result);
      setChangingStart(false);
      toast.success(`Day ${selectedDay} now starts at ${result}. Crosses were re-sorted into scoring intervals.`);
      setRefreshTick((tick) => tick + 1);
      return;
    }
    setChangeError(result?.fields?.startTime || result?.fields?.day || result?.message || 'The start time could not be changed.');
  };

  const setRef = (key) => (el) => {
    inputRefs.current[key] = el;
  };

  return (
    <>
      <PageHeader
        title="Enter scores"
        description="Record one cross at a time: the judge, the time, and the dogs in the order they crossed."
        meta={huntExists && huntType === 'DUAL' ? <StakeBadge stake="DUAL" /> : null}
      />

      {!huntLoading && !huntExists && (
        <Alert tone="warning" title="No hunt loaded" className="mb-6">
          <Link to="/hunt/create" className="font-medium underline">
            Create a hunt
          </Link>{' '}
          before entering scores.
        </Alert>
      )}
      {error.general && (
        <Alert tone="danger" className="mb-6">
          {error.general}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <Panel className="self-start">
          <PanelHeader title="Cross" />
          <PanelBody className="flex flex-col gap-4">
            <Field label="Day">
              <SegmentedControl
                label="Day"
                options={dayOptions(hunt)}
                value={selectedDay}
                onChange={setSelectedDay}
                optionRef={(value, el) => {
                  inputRefs.current[`day-${value}`] = el;
                }}
                onOptionKeyDown={(event, value) => handleKeyDown(event, `day-${value}`)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={
                  <span className="flex items-center justify-between gap-2">
                    Start time
                    {dayStarted && (
                      <button type="button" onClick={openChangeStart} className="text-tiny font-medium text-pine-700 hover:underline">
                        Change
                      </button>
                    )}
                  </span>
                }
                required={!dayStarted}
                error={error.startTime}
                hint={!error.startTime ? (dayStarted ? `Fixed by the first cross of day ${selectedDay}.` : 'The first cross of the day sets it.') : undefined}
              >
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    type="time"
                    invalid={invalid}
                    value={startTime}
                    readOnly={dayStarted}
                    onChange={(e) => setStartTime(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'startTime')}
                    ref={setRef('startTime')}
                    className="tabular read-only:bg-sunken read-only:text-ink-muted"
                  />
                )}
              </Field>
              <Field
                label="Cross time"
                required
                error={error.crossTime}
                hint={earlierThanLast ? <span className="text-warning-700">Earlier than judge {judge}&apos;s last cross at {judgesLastCross.time.slice(0, 5)}.</span> : undefined}
              >
                {({ id, invalid }) => (
                  <Input id={id} type="time" invalid={invalid} value={crossTime} onChange={(e) => setCrossTime(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'crossTime')} ref={setRef('crossTime')} className="tabular" autoFocus />
                )}
              </Field>
            </div>
            <Field label="Judge number" required error={error.judge}>
              {({ id, invalid }) => (
                <Input id={id} type="number" numeric min={1} invalid={invalid} value={judge} onChange={(e) => setJudge(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'judge')} ref={setRef('judge')} placeholder="Judge" />
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First dog points">
                {({ id }) => (
                  <Input id={id} type="number" numeric min={0} value={startingPoints} onChange={(e) => setStartingPoints(Number(e.target.value))} onKeyDown={(e) => handleKeyDown(e, 'startingPoints')} ref={setRef('startingPoints')} />
                )}
              </Field>
              <Field label="Point step">
                {({ id }) => (
                  <Input id={id} type="number" numeric min={0} value={interval} onChange={(e) => setInterval(Number(e.target.value))} onKeyDown={(e) => handleKeyDown(e, 'interval')} ref={setRef('interval')} />
                )}
              </Field>
            </div>
            <p className="text-small text-ink-muted">
              Scoring interval: <span className="tabular text-ink">{scoringInterval} min</span>. Only a dog&apos;s highest cross in each interval counts.
            </p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Dogs in the cross"
            description="In crossing order. Points fill in automatically and can be changed."
            actions={
              <Button size="sm" icon={LuPlus} onClick={addRow}>
                Add dog
              </Button>
            }
          />
          <table className="w-full border-collapse text-body">
            <thead>
              <tr className="border-b border-line-strong text-small font-medium text-ink-muted">
                <th className="w-12 px-4 py-2 text-right font-medium"></th>
                <th className="w-40 px-3 py-2 text-left font-medium">Dog number</th>
                <th className="w-32 px-3 py-2 text-right font-medium">Points</th>
                <th className="px-3 py-2 text-left font-medium">Stake</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, index) => {
                const unknown = dogs[index] && dogErrors[index];
                const serverError = error[`dogNumbers${index}`];
                const isSkipped = skipped[index];
                return (
                  <tr key={index} className={`border-b border-line last:border-b-0 ${isSkipped ? 'bg-sunken' : ''}`}>
                    <td className="px-4 py-1.5 text-right font-serif text-[16px] text-ink-faint tabular">{index + 1}</td>
                    <td className="px-3 py-1.5">
                      <CellInput
                        type="text"
                        inputMode="numeric"
                        aria-label={`Dog ${index + 1} number`}
                        value={dogs[index]}
                        invalid={Boolean(serverError || (unknown && !isSkipped))}
                        onChange={(e) => handleDogChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `dog-${index}`)}
                        ref={setRef(`dog-${index}`)}
                        className={`tabular ${isSkipped ? 'line-through text-ink-faint' : ''}`}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <CellInput
                        type="number"
                        numeric
                        min={0}
                        aria-label={`Dog ${index + 1} points`}
                        value={customPoints[index] !== null ? customPoints[index] : calculatePoints(index)}
                        invalid={Boolean(error[`scores${index}`])}
                        disabled={isSkipped}
                        onChange={(e) => handleCustomPointsChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `points-${index}`)}
                        ref={setRef(`points-${index}`)}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-small">
                      {isSkipped ? (
                        <span className="inline-flex flex-wrap items-center gap-2 text-ink-muted">
                          Skipped, not scored
                          <button type="button" onClick={() => setSkippedAt(index, false)} className="font-medium text-pine-700 hover:underline">
                            Include
                          </button>
                        </span>
                      ) : unknown || serverError ? (
                        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-warning-700">
                          <span className="inline-flex items-center gap-1.5">
                            <LuTriangleAlert size={14} aria-hidden />
                            {serverError || dogErrors[index]}
                          </span>
                          <span className="inline-flex gap-2">
                            <Button size="sm" variant="primary" onClick={() => openRegister(index)}>
                              Register dog {dogs[index]}
                            </Button>
                            <Button size="sm" onClick={() => setSkippedAt(index, true)}>
                              Skip
                            </Button>
                          </span>
                        </span>
                      ) : dogs[index] && dogStakes[index] ? (
                        <span className="inline-flex items-center gap-2">
                          <StakeBadge stake={String(dogStakes[index]).split(':')[0]} />
                          {String(dogStakes[index]).endsWith(':scratched') && (
                            <span className="inline-flex items-center gap-1 text-warning-700">
                              <LuTriangleAlert size={14} aria-hidden />
                              Scratched
                            </span>
                          )}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <PanelFooter>
            <Button variant="secondary" onClick={resetForm} onKeyDown={(e) => handleKeyDown(e, 'resetButton')} ref={setRef('resetButton')} disabled={saving}>
              Clear
            </Button>
            <Button variant="primary" onClick={handleSubmit} onKeyDown={(e) => handleKeyDown(e, 'submitButton')} ref={setRef('submitButton')} disabled={!huntExists} loading={saving}>
              Save cross
            </Button>
          </PanelFooter>
        </Panel>
      </div>

      {recent.length > 0 && (
        <Panel className="mt-6">
          <PanelHeader
            title={`Last crosses of day ${selectedDay}`}
            description={
              huntType === 'DUAL'
                ? 'Newest first, each dog tagged with its stake, so the two point ladders of a cross can be checked at a glance.'
                : 'Newest first, so the sheet can be checked against what was saved.'
            }
            actions={
              <Link to="/score-entry/view" className="text-small font-medium text-pine-700 hover:underline">
                All scores
              </Link>
            }
          />
          <ul className="divide-y divide-line">
            {recent.slice(0, 3).map((group) => (
              <li key={group.key} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-2.5 text-body">
                <span className="w-16 tabular font-medium">{group.time.slice(0, 5)}</span>
                <span className="w-20 text-ink-muted">Judge {group.judge}</span>
                <span className="flex flex-wrap gap-x-3 gap-y-1 tabular">
                  {group.dogs.map((score) => {
                    const dog = dogsByNumber[String(score.dogNumber)];
                    return (
                      <span
                        key={score.id}
                        className={`inline-flex items-center gap-1 ${score.counted ? '' : 'text-ink-faint'}`}
                        title={`${dog ? `${dog.name}. ` : ''}${score.counted ? 'Counted' : 'Not counted: a higher cross in the same interval'}`}
                      >
                        {score.dogNumber}
                        {dog && showsStake(hunt, dog.stake) && <StakeBadge stake={dog.stake} />}
                        <span className="text-ink-muted">({score.points})</span>
                      </span>
                    );
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Dialog
        open={registering !== null}
        onClose={() => setRegistering(null)}
        title={registering !== null ? `Register dog ${dogs[registering]}` : ''}
        description="The dog is added to this hunt and stays in the cross."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRegistering(null)} disabled={registerSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="register-dog-form" loading={registerSaving}>
              Register dog
            </Button>
          </>
        }
      >
        {registering !== null && (
          <form id="register-dog-form" onSubmit={saveRegistration} noValidate className="flex flex-col gap-4">
            <Field label="Name" required error={registerErrors.name}>
              {({ id, invalid }) => <Input id={id} invalid={invalid} value={registerValues.name} onChange={setRegisterValue('name')} autoFocus />}
            </Field>
            <Field label="Owner" required error={registerErrors.owner}>
              {({ id, invalid }) => <Input id={id} invalid={invalid} value={registerValues.owner} onChange={setRegisterValue('owner')} />}
            </Field>
            <Field label="Stake" hint={stakeForNumber(hunt, parseInt(dogs[registering], 10)) ? 'From the hunt’s number ranges.' : undefined}>
              <SegmentedControl
                label="Stake"
                options={REGISTER_STAKES}
                value={registerValues.stake}
                onChange={(stake) => setRegisterValues((current) => ({ ...current, stake }))}
                className="self-start"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sire">{({ id }) => <Input id={id} value={registerValues.sire} onChange={setRegisterValue('sire')} />}</Field>
              <Field label="Dam">{({ id }) => <Input id={id} value={registerValues.dam} onChange={setRegisterValue('dam')} />}</Field>
            </div>
          </form>
        )}
      </Dialog>

      <Dialog
        open={changingStart}
        onClose={() => setChangingStart(false)}
        title={`Change the start time of day ${selectedDay}`}
        description="Every cross of the day is re-sorted into scoring intervals from the new time. The new time cannot be later than the first cross."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setChangingStart(false)} disabled={changeSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="change-start-form" loading={changeSaving}>
              Change start time
            </Button>
          </>
        }
      >
        <form id="change-start-form" onSubmit={saveStartTime} noValidate>
          <Field label="New start time" required error={changeError}>
            {({ id, invalid }) => <Input id={id} type="time" invalid={invalid} value={newStart} onChange={(e) => setNewStart(e.target.value)} className="tabular" autoFocus />}
          </Field>
        </form>
      </Dialog>
    </>
  );
}

export default ScoreEntry;
