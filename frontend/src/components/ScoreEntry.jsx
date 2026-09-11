import { useCallback, useEffect, useRef, useState } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import DogService from '../services/DogService';
import { Alert, Button, CellInput, Field, Input, PageHeader, Panel, PanelBody, PanelFooter, PanelHeader, SegmentedControl, StakeBadge, useToast } from './ui';

const ROWS = 7;
const DAYS = [1, 2, 3, 4].map((day) => ({ value: day, label: `Day ${day}` }));

/**
 * The page scorekeepers live on. Everything is reachable with arrow keys and Enter, and the
 * points for each dog are worked out as numbers are typed so the judge can check them.
 */
function ScoreEntry() {
  const toast = useToast();
  const { hunt, loading: huntLoading } = useHunt();
  const huntExists = Boolean(hunt);
  const huntType = hunt?.stake || 'ALL_AGE';

  const [selectedDay, setSelectedDay] = useState(1);
  const [dogs, setDogs] = useState(Array(ROWS).fill(''));
  const [customPoints, setCustomPoints] = useState(Array(ROWS).fill(null));
  const [startingPoints, setStartingPoints] = useState(35);
  const [interval, setInterval] = useState(5);
  const [startTime, setStartTime] = useState('');
  // Once the first cross of a day has been saved, the day's start time is fixed on the server.
  const [dayStarted, setDayStarted] = useState(false);
  const [judge, setJudge] = useState('');
  const [crossTime, setCrossTime] = useState('');
  const [error, setError] = useState({});
  const [dogErrors, setDogErrors] = useState(Array(ROWS).fill(false));
  const [dogStakes, setDogStakes] = useState(Array(ROWS).fill(null));
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef({});
  const debounceTimerRef = useRef(null);
  const resetFlagRef = useRef(false);

  useEffect(() => {
    if (!huntExists) return;
    DogService.getStartTime(selectedDay).then((result) => {
      if (result instanceof Error || !result) {
        setError((current) => ({ ...current, startTime: undefined }));
        setStartTime('');
        setDayStarted(false);
      } else {
        setError((current) => ({ ...current, startTime: undefined }));
        setStartTime(result);
        setDayStarted(true);
      }
    });
  }, [selectedDay, huntExists]);

  const updateCrossInfo = useCallback(() => {
    if (!huntExists || resetFlagRef.current) return;
    const validDogs = dogs.filter((dog) => dog && dog.toString().trim() !== '');
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
        const nextErrors = Array(ROWS).fill(false);
        const nextStakes = [...dogStakes];
        dogs.forEach((dog, index) => {
          if (dog && dog.toString().trim() !== '') {
            const info = infoByDog[Number(dog)];
            if (info && !info.error) {
              nextStakes[index] = info.stake;
              if (nextPoints[index] === null) nextPoints[index] = info.points;
            } else {
              nextErrors[index] = info?.error || 'Not registered in this hunt';
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
  }, [dogs, startingPoints, interval, huntType, customPoints, huntExists, dogStakes]);

  useEffect(() => {
    updateCrossInfo();
  }, [dogs, startingPoints, interval, updateCrossInfo]);

  const handleDogChange = (index, value) => {
    setDogs((current) => current.map((dog, i) => (i === index ? value : dog)));
    if (!value) {
      setCustomPoints((current) => current.map((points, i) => (i === index ? null : points)));
      setDogErrors((current) => current.map((entry, i) => (i === index ? false : entry)));
      setDogStakes((current) => current.map((stake, i) => (i === index ? null : stake)));
    }
  };

  const handleCustomPointsChange = (index, value) => {
    setCustomPoints((current) => current.map((points, i) => (i === index ? (value === '' ? null : Number(value)) : points)));
  };

  const calculatePoints = (index) => {
    if (customPoints[index] !== null) return customPoints[index];
    const filled = dogs.filter((dog) => dog && dog.trim() !== '');
    const position = filled.findIndex((dog) => dog === dogs[index]);
    if (dogs[index] && position !== -1) return Math.max(0, startingPoints - position * interval);
    return Math.max(0, startingPoints - index * interval);
  };

  // Arrow-key map between fields. Returns true when the key was handled.
  const handleKeyDown = (event, fieldId) => {
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
      resetButton: { ArrowUp: `points-${ROWS - 1}`, ArrowLeft: 'submitButton' },
      submitButton: { ArrowUp: `points-${ROWS - 1}`, ArrowRight: 'resetButton' },
    };
    for (let i = 0; i < ROWS; i += 1) {
      map[`dog-${i}`] = {
        ArrowUp: i === 0 ? 'interval' : `dog-${i - 1}`,
        ArrowRight: `points-${i}`,
        ArrowDown: i === ROWS - 1 ? 'submitButton' : `dog-${i + 1}`,
        Enter: 'submitButton',
      };
      map[`points-${i}`] = {
        ArrowUp: i === 0 ? 'interval' : `points-${i - 1}`,
        ArrowLeft: `dog-${i}`,
        ArrowDown: i === ROWS - 1 ? 'submitButton' : `points-${i + 1}`,
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
    setStartingPoints(35);
    setCustomPoints(Array(ROWS).fill(null));
    setCrossTime('');
    setJudge('');
    setDogs(Array(ROWS).fill(''));
    setDogErrors(Array(ROWS).fill(false));
    setDogStakes(Array(ROWS).fill(null));
    setError({});
    if (!huntExists) setInterval(5);
    setTimeout(() => {
      resetFlagRef.current = false;
      inputRefs.current.crossTime?.focus();
    }, 50);
  };

  const handleSubmit = async () => {
    if (!huntExists) return;
    const filled = dogs.filter((dog) => dog && Number(dog));
    if (filled.length === 0) {
      setError((current) => ({ ...current, general: 'Enter at least one dog number.' }));
      return;
    }
    const scores = [];
    dogs.forEach((dog, index) => {
      if (dog && Number(dog)) scores.push(calculatePoints(index));
    });
    setSaving(true);
    const result = await DogService.postCross({
      day: selectedDay,
      startTime,
      judge: Number(judge),
      crossTime,
      dogNumbers: filled.map(Number),
      scores,
      interval,
    });
    setSaving(false);
    if (result) {
      setError(result.fields || { general: result.message || 'The cross could not be saved.' });
      return;
    }
    toast.success(`Cross at ${crossTime} saved for day ${selectedDay}.`);
    resetForm();
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
                options={DAYS}
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
                label="Start time"
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
              <Field label="Cross time" required error={error.crossTime}>
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
              <Field label="Interval">
                {({ id }) => (
                  <Input id={id} type="number" numeric min={0} value={interval} onChange={(e) => setInterval(Number(e.target.value))} onKeyDown={(e) => handleKeyDown(e, 'interval')} ref={setRef('interval')} />
                )}
              </Field>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Dogs in the cross" description="In crossing order. Points fill in automatically and can be changed." />
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
              {Array.from({ length: ROWS }, (_, index) => {
                const dogError = error[`dogNumbers${index}`] || dogErrors[index];
                return (
                  <tr key={index} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-1.5 text-right font-serif text-[16px] text-ink-faint tabular">{index + 1}</td>
                    <td className="px-3 py-1.5">
                      <CellInput
                        type="text"
                        inputMode="numeric"
                        aria-label={`Dog ${index + 1} number`}
                        value={dogs[index]}
                        invalid={Boolean(dogError)}
                        onChange={(e) => handleDogChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `dog-${index}`)}
                        ref={setRef(`dog-${index}`)}
                        className="tabular"
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
                        onChange={(e) => handleCustomPointsChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `points-${index}`)}
                        ref={setRef(`points-${index}`)}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-small">
                      {dogError ? (
                        <span className="inline-flex items-center gap-1.5 text-warning-700">
                          <LuTriangleAlert size={14} aria-hidden />
                          {typeof dogError === 'string' ? dogError : 'Not registered in this hunt'}
                        </span>
                      ) : dogs[index] && dogStakes[index] ? (
                        <StakeBadge stake={dogStakes[index]} />
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
    </>
  );
}

export default ScoreEntry;
