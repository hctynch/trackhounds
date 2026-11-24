import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LuPencil, LuPlus, LuTrash2, LuTriangleAlert } from 'react-icons/lu';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import { dayOptions, ladderPoints, lowestCrossPoints, showsStake, stakeForNumber } from '../lib/hunt';
import { TIME_HELP, formatTime, parseTime } from '../lib/time';
import DogService from '../services/DogService';
import {
  Alert,
  Badge,
  Button,
  CellInput,
  ConfirmDialog,
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
  TimeInput,
  useToast,
} from './ui';

const MIN_ROWS = 7;
const REGISTER_STAKES = ['ALL_AGE', 'DERBY'].map((value) => ({ value, label: STAKE_LABELS[value] }));

const isDogNumber = (value) => /^[0-9]{1,6}$/.test(String(value ?? '').trim());
const filled = (count, value) => Array.from({ length: count }, () => value);
const padded = (values, count, value) => [...values, ...filled(Math.max(0, count - values.length), value)];
const numberIn = (value) => String(value ?? '').trim();

/** The dogs of a cross on one line: number, stake tag where it says something, and points. */
function CrossDogs({ cross, hunt }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1 tabular">
      {cross.scores.map((score) => (
        <span
          key={score.id}
          className={`inline-flex items-center gap-1 ${score.counted ? '' : 'text-ink-faint'}`}
          title={`${score.dogName ? `${score.dogName}. ` : ''}${score.counted ? 'Counted' : 'Not counted: a higher cross in the same interval'}`}
        >
          {score.dogNumber}
          {showsStake(hunt, score.stake) && <StakeBadge stake={score.stake} />}
          <span className="text-ink-muted">({score.points})</span>
        </span>
      ))}
    </span>
  );
}

CrossDogs.propTypes = {
  cross: PropTypes.shape({ scores: PropTypes.array.isRequired }).isRequired,
  hunt: PropTypes.object,
};

/**
 * The page scorekeepers live on. One cross at a time: the judge, the time, and the dogs in the
 * order they crossed. Everything is reachable from the keyboard (Enter and Tab move forward, the
 * arrow keys move in every direction), the points for each dog are proposed as numbers are typed,
 * and a dog that is not registered can be registered on the spot or skipped.
 *
 * With `crossId` the page corrects a cross that was already saved instead of entering a new one.
 */
function ScoreEntry({ crossId }) {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { hunt, loading: huntLoading } = useHunt();
  const huntExists = Boolean(hunt);
  const huntType = hunt?.stake || 'ALL_AGE';
  const scoringInterval = hunt?.huntInterval ?? 0;
  const lowest = lowestCrossPoints(hunt);
  const editing = Boolean(crossId);
  const backTo = location.state?.from || '/score-entry/view';

  const [selectedDay, setSelectedDay] = useState(1);
  const [rows, setRows] = useState(MIN_ROWS);
  const [dogs, setDogs] = useState(filled(MIN_ROWS, ''));
  // Points come from two places and are kept apart: what the scoring proposes for the dogs as
  // they stand (autoPoints, from the server), and what the operator typed over it (customPoints).
  const [customPoints, setCustomPoints] = useState(filled(MIN_ROWS, null));
  const [autoPoints, setAutoPoints] = useState(filled(MIN_ROWS, null));
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
  const [crosses, setCrosses] = useState([]); // every cross of the hunt, with its dogs

  // Correcting a saved cross
  const [original, setOriginal] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
  const resetFlagRef = useRef(false);
  const proposalRef = useRef(0);
  // After a saved cross is loaded, stored points that equal the proposal are automatic again.
  const reconcileRef = useRef(false);

  useEffect(() => {
    if (!huntExists) return undefined;
    let cancelled = false;
    DogService.getCrosses().then((list) => {
      if (!cancelled) setCrosses(Array.isArray(list) ? list : []);
    });
    return () => {
      cancelled = true;
    };
  }, [huntExists, refreshTick]);

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
        setStartTime(formatTime(result));
        setDayStarted(true);
      }
    });
  }, [selectedDay, huntExists, refreshTick]);

  // Load the cross that is being corrected.
  useEffect(() => {
    if (!editing || !huntExists) return undefined;
    let cancelled = false;
    DogService.getCrossById(crossId).then((cross) => {
      if (cancelled) return;
      if (!cross || !Array.isArray(cross.scores)) {
        setLoadError(cross?.fields?.cross || cross?.message || 'That cross could not be loaded.');
        return;
      }
      const count = Math.max(MIN_ROWS, cross.scores.length + 1);
      setOriginal(cross);
      setSelectedDay(cross.day);
      setCrossTime(formatTime(cross.time));
      setJudge(String(cross.judgeNumber));
      setRows(count);
      setDogs(padded(cross.scores.map((score) => String(score.dogNumber)), count, ''));
      setCustomPoints(padded(cross.scores.map((score) => score.points), count, null));
      setAutoPoints(filled(count, null));
      setDogErrors(filled(count, false));
      setDogStakes(filled(count, null));
      setSkipped(filled(count, false));
      reconcileRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [editing, crossId, huntExists]);

  // Ask the server what the scoring proposes for the dogs as they stand: the two ladders of a
  // dual hunt, the pack minimum, and which numbers are not registered.
  useEffect(() => {
    if (!huntExists || resetFlagRef.current) return undefined;
    const entered = dogs.map((dog, index) => ({ number: numberIn(dog), index })).filter((entry) => entry.number !== '');
    if (entered.length === 0) return undefined;
    const request = ++proposalRef.current;
    const timer = setTimeout(async () => {
      const info = await DogService.getCrossInfo(
        entered.map((entry) => entry.number),
        startingPoints,
        interval,
        huntType,
      );
      if (request !== proposalRef.current || resetFlagRef.current || !Array.isArray(info) || info.length !== entered.length) return;
      const nextAuto = filled(rows, null);
      const nextErrors = filled(rows, false);
      const nextStakes = filled(rows, null);
      entered.forEach((entry, position) => {
        const row = info[position];
        if (row && !row.error) {
          nextAuto[entry.index] = row.points;
          nextStakes[entry.index] = row.scratched ? `${row.stake}:scratched` : row.stake;
        } else {
          nextErrors[entry.index] = `Dog ${entry.number} is not registered in this hunt.`;
        }
      });
      setAutoPoints(nextAuto);
      setDogErrors(nextErrors);
      setDogStakes(nextStakes);
      if (reconcileRef.current) {
        reconcileRef.current = false;
        setCustomPoints((current) => current.map((value, index) => (value !== null && value === nextAuto[index] ? null : value)));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [dogs, startingPoints, interval, huntType, huntExists, rows, refreshTick]);

  const otherCrossesOfJudge = useMemo(
    () => (judge ? crosses.filter((cross) => cross.day === selectedDay && String(cross.judgeNumber) === String(judge) && String(cross.id) !== String(crossId ?? '')) : []),
    [crosses, judge, selectedDay, crossId],
  );
  const typedCrossTime = parseTime(crossTime);
  const judgesLastCross = otherCrossesOfJudge.length > 0 ? otherCrossesOfJudge[otherCrossesOfJudge.length - 1] : null;
  const sameTimeCross = typedCrossTime ? otherCrossesOfJudge.find((cross) => formatTime(cross.time) === typedCrossTime) : null;
  const earlierThanLast = Boolean(!editing && typedCrossTime && judgesLastCross && typedCrossTime < formatTime(judgesLastCross.time));
  const lastEntered = useMemo(() => [...crosses].sort((a, b) => b.id - a.id).slice(0, 3), [crosses]);

  const setAt = (setter) => (index, value) => setter((current) => current.map((entry, i) => (i === index ? value : entry)));
  const setDogAt = setAt(setDogs);
  const setPointsAt = setAt(setCustomPoints);
  const setErrorAt = setAt(setDogErrors);
  const setStakeAt = setAt(setDogStakes);
  const setSkippedAt = setAt(setSkipped);

  const handleDogChange = (index, value) => {
    setDogAt(index, value);
    setSkippedAt(index, false);
    setErrorAt(index, false);
    if (!value) {
      setPointsAt(index, null);
      setStakeAt(index, null);
    }
  };

  // An emptied points box goes back to the proposed points.
  const handleCustomPointsChange = (index, value) => setPointsAt(index, value === '' ? null : Number(value));

  // Until the server answers: the place a row takes among the rows that hold a dog. A row that is
  // skipped still holds its dog, so the dogs behind it keep their places.
  const localPoints = (index) => {
    const position = numberIn(dogs[index]) ? dogs.slice(0, index).filter((dog) => numberIn(dog) !== '').length : index;
    return ladderPoints(startingPoints, interval, position, lowest);
  };

  const pointsFor = (index) => {
    if (customPoints[index] !== null) return customPoints[index];
    if (numberIn(dogs[index]) && autoPoints[index] !== null) return autoPoints[index];
    return localPoints(index);
  };

  const addRow = () => {
    const next = rows + 1;
    setRows(next);
    setDogs((current) => [...current, '']);
    setCustomPoints((current) => [...current, null]);
    setAutoPoints((current) => [...current, null]);
    setDogErrors((current) => [...current, false]);
    setDogStakes((current) => [...current, null]);
    setSkipped((current) => [...current, false]);
    setTimeout(() => inputRefs.current[`dog-${next - 1}`]?.focus(), 0);
  };

  const focusField = (fieldId) => {
    const target = inputRefs.current[fieldId];
    if (!target) return;
    target.focus();
    if (typeof target.select === 'function') target.select();
    if (fieldId.startsWith('day-')) setSelectedDay(parseInt(fieldId.split('-')[1], 10));
  };

  /**
   * Where Enter goes from a box: forward through the cross, the way the judge's card reads (time,
   * judge, then down the dog numbers; the points fill in by themselves and are skipped). Enter on
   * an empty dog row means the cross is complete and moves to Save; on the last row it adds a row.
   * Returns undefined where Enter keeps its own meaning (buttons, the day selector).
   */
  const enterTarget = (fieldId) => {
    const last = rows - 1;
    if (fieldId === 'startTime') return 'crossTime';
    if (fieldId === 'crossTime') return 'judge';
    if (fieldId === 'judge') return 'dog-0';
    if (fieldId === 'startingPoints') return 'interval';
    if (fieldId === 'interval') return 'dog-0';
    const row = /^(dog|points)-(\d+)$/.exec(fieldId);
    if (!row) return undefined;
    const index = Number(row[2]);
    if (row[1] === 'dog' && !numberIn(dogs[index])) return 'submitButton';
    if (index === last) return row[1] === 'dog' ? 'addRow' : 'submitButton';
    return `dog-${index + 1}`;
  };

  // Enter moves forward and the arrow keys move between fields. Returns true when the key was handled.
  const handleKeyDown = (event, fieldId) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const next = enterTarget(fieldId);
      if (next === undefined) return false;
      event.preventDefault();
      if (next === 'addRow') addRow();
      else focusField(next);
      return true;
    }
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
      };
      map[`points-${i}`] = {
        ArrowUp: i === 0 ? 'interval' : `points-${i - 1}`,
        ArrowLeft: `dog-${i}`,
        ArrowDown: i === last ? 'submitButton' : `points-${i + 1}`,
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
    proposalRef.current += 1;
    setRows(MIN_ROWS);
    setStartingPoints(hunt?.firstDogPoints ?? 35);
    setInterval(hunt?.pointStep ?? 5);
    setCustomPoints(filled(MIN_ROWS, null));
    setAutoPoints(filled(MIN_ROWS, null));
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
    if (!huntExists || saving) return;
    const entered = dogs.map((dog, index) => ({ number: numberIn(dog), index })).filter((entry) => entry.number !== '');
    const badFormat = entered.find((entry) => !isDogNumber(entry.number));
    if (badFormat) {
      setError({ general: `Dog number "${badFormat.number}" is not valid: digits only, for example 12 or 007.` });
      focusField(`dog-${badFormat.index}`);
      return;
    }
    // Times may be typed without the colon; they are sent as HH:MM.
    const found = {};
    const time = parseTime(crossTime);
    if (!time) found.crossTime = crossTime.trim() ? TIME_HELP : 'Enter the cross time.';
    const start = parseTime(startTime);
    if (!dayStarted && !start) found.startTime = startTime.trim() ? TIME_HELP : 'Enter the start time of the day.';
    if (Object.keys(found).length > 0) {
      setError(found);
      focusField(found.startTime ? 'startTime' : 'crossTime');
      return;
    }

    setSaving(true);
    // A fresh proposal for exactly these dogs: the one on screen may be a keystroke behind when
    // the cross is typed and saved from the keyboard in one go.
    const proposal = await DogService.getCrossInfo(
      entered.map((entry) => entry.number),
      startingPoints,
      interval,
      huntType,
    );
    const fresh = Array.isArray(proposal) && proposal.length === entered.length ? proposal : null;
    const isUnknown = (entry, position) => (fresh ? Boolean(fresh[position]?.error) : Boolean(dogErrors[entry.index]));
    const unknown = entered.filter((entry, position) => isUnknown(entry, position) && !skipped[entry.index]);
    if (unknown.length > 0) {
      setDogErrors((current) => current.map((value, index) => (unknown.some((entry) => entry.index === index) ? `Dog ${numberIn(dogs[index])} is not registered in this hunt.` : value)));
      setError({ general: `Dog ${unknown[0].number} is not registered. Register it or skip it before saving.` });
      setSaving(false);
      focusField(`dog-${unknown[0].index}`);
      return;
    }
    const included = entered.map((entry, position) => ({ ...entry, position })).filter((entry) => !skipped[entry.index]);
    if (included.length === 0) {
      setError({ general: 'Enter at least one dog number.' });
      setSaving(false);
      focusField('dog-0');
      return;
    }
    const pointsOf = (entry) => {
      if (customPoints[entry.index] !== null) return customPoints[entry.index];
      if (fresh && typeof fresh[entry.position]?.points === 'number') return fresh[entry.position].points;
      return pointsFor(entry.index);
    };
    const cross = {
      day: selectedDay,
      startTime: start || startTime,
      judge: Number(judge),
      crossTime: time,
      dogNumbers: included.map((entry) => entry.number),
      scores: included.map(pointsOf),
      // Buckets use the hunt's scoring interval; the server reads it from the hunt.
      interval: scoringInterval,
    };
    const result = editing ? await DogService.updateCross(crossId, cross) : await DogService.postCross(cross);
    setSaving(false);
    if (result) {
      // The server numbers dogs and scores by their place in what was sent; put each message on
      // its row, and anything the page has no box for at the top.
      const shown = {};
      const general = [];
      Object.entries(result.fields || {}).forEach(([key, message]) => {
        const perRow = /^(dogNumbers|scores)(\d+)$/.exec(key);
        if (perRow && included[Number(perRow[2])]) shown[`${perRow[1]}${included[Number(perRow[2])].index}`] = message;
        else if (['startTime', 'crossTime', 'judge'].includes(key)) shown[key] = message;
        else general.push(message);
      });
      if (general.length > 0 || Object.keys(shown).length === 0) shown.general = general.join(' ') || result.message || 'The cross could not be saved.';
      setError(shown);
      return;
    }
    const skippedCount = skipped.filter((entry, index) => entry && numberIn(dogs[index])).length;
    const skippedNote = skippedCount ? `, ${skippedCount} ${skippedCount === 1 ? 'dog' : 'dogs'} skipped` : '';
    if (editing) {
      toast.success(`Cross at ${time} on day ${selectedDay} updated${skippedNote}. Standings are recalculated.`);
      navigate(backTo);
      return;
    }
    toast.success(`Cross at ${time} saved for day ${selectedDay}${skippedNote}.`);
    setRefreshTick((tick) => tick + 1);
    resetForm();
  };

  const deleteCross = async () => {
    setDeleting(true);
    const result = await DogService.removeCross(crossId);
    setDeleting(false);
    if (result) {
      toast.error(result.message || 'The cross could not be deleted.');
      return;
    }
    toast.success(`Cross at ${formatTime(original?.time)} on day ${original?.day} deleted. Standings are recalculated.`);
    navigate(backTo);
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
    setError((current) => ({ ...current, general: undefined, [`dogNumbers${registering}`]: undefined }));
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
    const time = parseTime(newStart);
    if (!time) {
      setChangeError(newStart.trim() ? TIME_HELP : 'Enter the new start time.');
      return;
    }
    setChangeSaving(true);
    const result = await DogService.changeStartTime(selectedDay, time);
    setChangeSaving(false);
    if (typeof result === 'string') {
      setStartTime(formatTime(result));
      setChangingStart(false);
      toast.success(`Day ${selectedDay} now starts at ${formatTime(result)}. Crosses were re-sorted into scoring intervals.`);
      setRefreshTick((tick) => tick + 1);
      return;
    }
    setChangeError(result?.fields?.startTime || result?.fields?.day || result?.message || 'The start time could not be changed.');
  };

  const setRef = (key) => (el) => {
    inputRefs.current[key] = el;
  };

  if (editing && loadError) {
    return (
      <>
        <PageHeader backTo={backTo} backLabel="Back to the scores" title="Edit cross" />
        <Alert tone="danger" title="That cross could not be opened">
          {loadError}
        </Alert>
      </>
    );
  }

  const crossTimeHint = sameTimeCross ? (
    <span className="text-warning-700">
      Judge {judge} already has a cross at {typedCrossTime} on day {selectedDay}. Saving {editing ? 'leaves two at that time' : 'adds a second one'}.
    </span>
  ) : earlierThanLast ? (
    <span className="text-warning-700">
      Earlier than judge {judge}&apos;s last cross at {formatTime(judgesLastCross.time)}.
    </span>
  ) : undefined;

  return (
    <>
      {editing ? (
        <PageHeader
          backTo={backTo}
          backLabel="Back to the scores"
          title="Edit cross"
          description={
            original
              ? `Day ${original.day}, ${formatTime(original.time)}, judge ${original.judgeNumber}, as it was saved. Change the day, time, judge, dogs or points; saving replaces the cross and recalculates the standings.`
              : 'Loading the cross'
          }
          meta={huntExists && huntType === 'DUAL' ? <StakeBadge stake="DUAL" /> : null}
        />
      ) : (
        <PageHeader
          title="Enter scores"
          description="Record one cross at a time: the judge, the time, and the dogs in the order they crossed."
          meta={huntExists && huntType === 'DUAL' ? <StakeBadge stake="DUAL" /> : null}
        />
      )}

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
                  <TimeInput
                    id={id}
                    invalid={invalid}
                    value={startTime}
                    readOnly={dayStarted}
                    onChange={setStartTime}
                    onKeyDown={(e) => handleKeyDown(e, 'startTime')}
                    ref={setRef('startTime')}
                    className="read-only:bg-sunken read-only:text-ink-muted"
                  />
                )}
              </Field>
              <Field label="Cross time" required error={error.crossTime} hint={crossTimeHint}>
                {({ id, invalid }) => (
                  <TimeInput id={id} invalid={invalid} value={crossTime} onChange={setCrossTime} onKeyDown={(e) => handleKeyDown(e, 'crossTime')} ref={setRef('crossTime')} autoFocus />
                )}
              </Field>
            </div>
            <p className="-mt-2 text-small text-ink-muted">Times can be typed without the colon: 0600 or 1300.</p>
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
            <div className="flex flex-col gap-1 text-small text-ink-muted">
              <p>
                Scoring interval: <span className="tabular text-ink">{scoringInterval} min</span>. Only a dog&apos;s highest cross in each interval counts.
              </p>
              {hunt?.packScoring && (
                <p>
                  Pack scoring: points stop at <span className="tabular text-ink">{lowest}</span>, and every dog after that also gets {lowest}.
                </p>
              )}
            </div>
          </PanelBody>
        </Panel>

        <Panel className="self-start">
          <PanelHeader
            title="Dogs in the cross"
            description="In crossing order. Points fill in automatically and can be changed. Enter moves to the next dog; on an empty row it moves to Save."
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
                        title={customPoints[index] !== null ? 'Typed in. Empty the box to go back to the proposed points.' : undefined}
                        value={pointsFor(index)}
                        invalid={Boolean(error[`scores${index}`])}
                        disabled={isSkipped}
                        onChange={(e) => handleCustomPointsChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `points-${index}`)}
                        ref={setRef(`points-${index}`)}
                        className={customPoints[index] !== null ? 'font-semibold' : ''}
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
                          {unknown && (
                            <span className="inline-flex gap-2">
                              <Button size="sm" variant="primary" onClick={() => openRegister(index)}>
                                Register dog {dogs[index]}
                              </Button>
                              <Button size="sm" onClick={() => setSkippedAt(index, true)}>
                                Skip
                              </Button>
                            </span>
                          )}
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
            {editing && (
              <Button variant="danger" icon={LuTrash2} onClick={() => setConfirmDelete(true)} disabled={saving || !original} className="mr-auto">
                Delete cross
              </Button>
            )}
            {editing ? (
              <Button variant="secondary" onClick={() => navigate(backTo)} onKeyDown={(e) => handleKeyDown(e, 'resetButton')} ref={setRef('resetButton')} disabled={saving}>
                Cancel
              </Button>
            ) : (
              <Button variant="secondary" onClick={resetForm} onKeyDown={(e) => handleKeyDown(e, 'resetButton')} ref={setRef('resetButton')} disabled={saving}>
                Clear
              </Button>
            )}
            <Button variant="primary" onClick={handleSubmit} onKeyDown={(e) => handleKeyDown(e, 'submitButton')} ref={setRef('submitButton')} disabled={!huntExists || (editing && !original)} loading={saving}>
              {editing ? 'Save changes' : 'Save cross'}
            </Button>
          </PanelFooter>
        </Panel>
      </div>

      {!editing && lastEntered.length > 0 && (
        <Panel className="mt-6">
          <PanelHeader
            title="Last crosses entered"
            description={`The crosses typed in most recently, newest first, whatever their day or cross time. Check them against the judge's card${
              huntType === 'DUAL' ? '; each dog is tagged with its stake so the two point ladders can be told apart' : ''
            }.`}
            actions={
              <Link to="/score-entry/view" className="text-small font-medium text-pine-700 hover:underline">
                All scores
              </Link>
            }
          />
          <ul className="divide-y divide-line">
            {lastEntered.map((cross, index) => (
              <li key={cross.id} className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-2.5 text-body ${index === 0 ? 'bg-brass-100/40' : ''}`}>
                <span className="w-14 text-ink-muted">Day {cross.day}</span>
                <span className="w-14 tabular font-medium">{formatTime(cross.time)}</span>
                <span className="w-20 text-ink-muted">Judge {cross.judgeNumber}</span>
                <span className="min-w-0 flex-1">
                  <CrossDogs cross={cross} hunt={hunt} />
                </span>
                {index === 0 && <Badge tone="brass">Last entered</Badge>}
                <Link
                  to={`/score-entry/view/${cross.id}`}
                  state={{ from: '/score-entry/enter' }}
                  className="inline-flex items-center gap-1 text-small font-medium text-pine-700 hover:underline"
                >
                  <LuPencil size={13} aria-hidden />
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteCross}
        busy={deleting}
        danger
        title="Delete this cross?"
        description={
          original
            ? `Day ${original.day}, ${formatTime(original.time)}, judge ${original.judgeNumber}, ${original.scores.length} ${original.scores.length === 1 ? 'dog' : 'dogs'}. Every score in it is removed and the standings are recalculated.`
            : ''
        }
        confirmLabel="Delete cross"
      />

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
          <Field label="New start time" required error={changeError} hint="With or without the colon: 0600 or 06:00.">
            {({ id, invalid }) => <TimeInput id={id} invalid={invalid} value={newStart} onChange={setNewStart} autoFocus />}
          </Field>
        </form>
      </Dialog>
    </>
  );
}

ScoreEntry.propTypes = {
  crossId: PropTypes.string,
};

/** Route wrapper for correcting a saved cross; a fresh page for every cross. */
export function EditCross() {
  const { crossId } = useParams();
  return <ScoreEntry key={crossId} crossId={crossId} />;
}

export default ScoreEntry;
