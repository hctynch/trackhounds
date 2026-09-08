import { useEffect, useRef, useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import DogService from '../services/DogService';
import { Alert, Button, CellInput, Field, Input, PageHeader, Panel, PanelBody, PanelFooter, PanelHeader, STAKE_LABELS, useToast } from './ui';

const FIELDS = ['number', 'name', 'stake', 'sire', 'dam'];
const emptyRow = () => ({ number: '', name: '', stake: 'ALL_AGE', sire: '', dam: '' });

/**
 * Register several dogs at once. Arrow keys move between cells; sire and dam offer the names
 * already typed in other rows so litters can be entered quickly.
 */
function AddDogs() {
  const navigate = useNavigate();
  const toast = useToast();
  const { hunt } = useHunt();
  const [dogs, setDogs] = useState(Array.from({ length: 7 }, emptyRow));
  const [owner, setOwner] = useState('');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState({ index: -1, field: '' });
  const [highlighted, setHighlighted] = useState(-1);
  const inputRefs = useRef({});
  const suggestionRefs = useRef({});

  const closeSuggestions = () => {
    setSuggestions([]);
    setActiveField({ index: -1, field: '' });
    setHighlighted(-1);
  };

  const generateSuggestions = (field, value) => {
    if (!value) {
      setSuggestions([]);
      return;
    }
    const unique = Array.from(new Set(dogs.map((dog) => dog[field]).filter((entry) => entry && entry.trim() !== '')));
    setSuggestions(unique.filter((entry) => entry.toLowerCase().includes(value.toLowerCase()) && entry.toLowerCase() !== value.toLowerCase()));
    setHighlighted(-1);
  };

  const stakeForNumber = (number) => {
    if (!hunt?.stakeRange || !hunt?.stakeTypeRange) return null;
    for (let i = 0; i < hunt.stakeRange.length; i += 1) {
      const isLast = i === hunt.stakeRange.length - 1;
      if (number >= hunt.stakeRange[i] && (isLast || number < hunt.stakeRange[i + 1])) return hunt.stakeTypeRange[i];
    }
    return null;
  };

  const handleChange = (index, field, value) => {
    setSubmitted(false);
    setDogs((current) => {
      const next = current.map((dog, i) => (i === index ? { ...dog, [field]: value } : dog));
      if (field === 'number') {
        const stake = stakeForNumber(parseInt(value, 10));
        if (stake) next[index].stake = stake;
      }
      return next;
    });
    if (field === 'sire' || field === 'dam') {
      setActiveField({ index, field });
      generateSuggestions(field, value);
    } else {
      closeSuggestions();
    }
  };

  const selectSuggestion = (suggestion) => {
    const { index, field } = activeField;
    if (index < 0 || !field) return;
    setDogs((current) => current.map((dog, i) => (i === index ? { ...dog, [field]: suggestion } : dog)));
    closeSuggestions();
    const nextKey = field === 'sire' ? `dam-${index}` : `number-${index + 1}`;
    inputRefs.current[nextKey]?.focus();
  };

  const moveFocus = (event, index, field) => {
    const column = FIELDS.indexOf(field);
    let target = null;
    if (event.key === 'ArrowRight' && column < FIELDS.length - 1) target = `${FIELDS[column + 1]}-${index}`;
    if (event.key === 'ArrowLeft' && column > 0) target = `${FIELDS[column - 1]}-${index}`;
    if (event.key === 'ArrowUp' && index > 0) target = `${field}-${index - 1}`;
    if (event.key === 'ArrowDown' && index < dogs.length - 1) target = `${field}-${index + 1}`;
    if (target) {
      event.preventDefault();
      inputRefs.current[target]?.focus();
      closeSuggestions();
    }
  };

  const handleKeyDown = (event, index, field) => {
    const showing = suggestions.length > 0 && activeField.index === index && activeField.field === field;
    if (!showing) {
      moveFocus(event, index, field);
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlighted((current) => (current < suggestions.length - 1 ? current + 1 : 0));
        break;
      case 'ArrowUp':
        if (highlighted === -1) {
          moveFocus(event, index, field);
        } else {
          event.preventDefault();
          setHighlighted((current) => (current > 0 ? current - 1 : suggestions.length - 1));
        }
        break;
      case 'Tab':
      case 'Enter':
        if (highlighted >= 0) {
          event.preventDefault();
          selectSuggestion(suggestions[highlighted]);
        } else if (event.key === 'Tab') {
          closeSuggestions();
        }
        break;
      case 'Escape':
        event.preventDefault();
        closeSuggestions();
        break;
      default:
        moveFocus(event, index, field);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inside = Object.values(suggestionRefs.current).some((ref) => ref && ref.contains(event.target));
      if (!inside && suggestions.length > 0) closeSuggestions();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [suggestions]);

  // A partly filled row is a mistake waiting to happen; say so as soon as it appears.
  const rowErrors = {};
  dogs.forEach((dog, index) => {
    const touched = dog.number || dog.name || dog.sire || dog.dam;
    const complete = dog.number && dog.name && dog.stake && dog.sire && dog.dam;
    if (touched && !complete) rowErrors[`row${index}`] = `Row ${index + 1}: fill in every field or clear the row.`;
  });
  const allErrors = { ...rowErrors, ...(submitted ? errors : {}) };
  const errorList = Object.values(allErrors);

  const handleSubmit = async () => {
    const complete = dogs.filter((dog) => dog.number && dog.name && dog.stake && dog.sire && dog.dam).map((dog) => ({ ...dog, owner }));
    setSubmitted(true);
    if (Object.keys(rowErrors).length > 0) return;
    if (complete.length === 0) {
      setErrors({ general: 'Enter at least one complete dog.' });
      return;
    }
    setSaving(true);
    const result = await DogService.createDogs(complete);
    setSaving(false);
    if (result && result.fields) {
      setErrors(result.fields);
      return;
    }
    if (result && result.message) {
      setErrors({ general: result.message });
      return;
    }
    toast.success(`${complete.length} ${complete.length === 1 ? 'dog' : 'dogs'} registered.`);
    navigate('/dogs/all');
  };

  const rowInvalid = (index, field) => Boolean(allErrors[`row${index}`] || allErrors[`${field}${index + 1}`]);

  const renderSuggestions = (index, field) =>
    suggestions.length > 0 &&
    activeField.index === index &&
    activeField.field === field && (
      <ul
        ref={(el) => {
          suggestionRefs.current[`${field}-${index}`] = el;
        }}
        role="listbox"
        className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full min-w-40 overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-pop"
      >
        {suggestions.map((suggestion, i) => (
          <li
            key={suggestion}
            role="option"
            aria-selected={highlighted === i}
            onMouseDown={() => selectSuggestion(suggestion)}
            className={`cursor-pointer px-3 py-1.5 text-small ${highlighted === i ? 'bg-pine-100 text-pine-800' : 'hover:bg-pine-50'}`}
          >
            {suggestion}
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <PageHeader
        backTo="/dogs/all"
        backLabel="All dogs"
        title="Add dogs"
        description={hunt ? `Registering for ${hunt.title}. Arrow keys move between cells.` : 'Create a hunt before registering dogs.'}
      />

      <div className="flex flex-col gap-6">
        <Panel>
          <PanelBody className="max-w-md">
            <Field label="Owner" hint="Applied to every dog on this page.">
              {({ id }) => <Input id={id} value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Owner or kennel" autoFocus />}
            </Field>
          </PanelBody>
        </Panel>

        {errorList.length > 0 && <Alert tone="danger" title="Fix these before saving" items={errorList} />}

        <Panel>
          <PanelHeader
            title="Dogs"
            description="Numbers outside the hunt's ranges keep the stake you choose."
            actions={
              <Button size="sm" icon={LuPlus} onClick={() => setDogs((current) => [...current, emptyRow()])}>
                Add row
              </Button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-body">
              <thead>
                <tr className="border-b border-line-strong text-small font-medium text-ink-muted">
                  <th className="w-10 px-3 py-2 text-right font-medium"></th>
                  <th className="w-24 px-2 py-2 text-left font-medium">Number</th>
                  <th className="px-2 py-2 text-left font-medium">Name</th>
                  <th className="w-36 px-2 py-2 text-left font-medium">Stake</th>
                  <th className="px-2 py-2 text-left font-medium">Sire</th>
                  <th className="px-2 py-2 text-left font-medium">Dam</th>
                </tr>
              </thead>
              <tbody>
                {dogs.map((dog, index) => (
                  <tr key={index} className={`border-b border-line last:border-b-0 ${allErrors[`row${index}`] ? 'bg-danger-100/40' : ''}`}>
                    <td className="px-3 py-1.5 text-right text-small text-ink-faint tabular">{index + 1}</td>
                    <td className="px-2 py-1.5">
                      <CellInput
                        type="number"
                        numeric
                        min={1}
                        name="number"
                        aria-label={`Row ${index + 1} number`}
                        ref={(el) => {
                          inputRefs.current[`number-${index}`] = el;
                        }}
                        invalid={rowInvalid(index, 'number')}
                        value={dog.number}
                        onChange={(event) => handleChange(index, 'number', event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, index, 'number')}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <CellInput
                        name="name"
                        aria-label={`Row ${index + 1} name`}
                        ref={(el) => {
                          inputRefs.current[`name-${index}`] = el;
                        }}
                        invalid={rowInvalid(index, 'name')}
                        value={dog.name}
                        onChange={(event) => handleChange(index, 'name', event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, index, 'name')}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        name="stake"
                        aria-label={`Row ${index + 1} stake`}
                        ref={(el) => {
                          inputRefs.current[`stake-${index}`] = el;
                        }}
                        value={dog.stake}
                        onChange={(event) => handleChange(index, 'stake', event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, index, 'stake')}
                        className={`h-8 w-full rounded-sm border bg-surface px-2 text-body ${rowInvalid(index, 'stake') ? 'border-danger-600' : 'border-line hover:border-pine-300 focus-visible:border-pine-500'}`}
                      >
                        <option value="ALL_AGE">{STAKE_LABELS.ALL_AGE}</option>
                        <option value="DERBY">{STAKE_LABELS.DERBY}</option>
                      </select>
                    </td>
                    <td className="relative px-2 py-1.5">
                      <CellInput
                        name="sire"
                        aria-label={`Row ${index + 1} sire`}
                        autoComplete="off"
                        ref={(el) => {
                          inputRefs.current[`sire-${index}`] = el;
                        }}
                        invalid={rowInvalid(index, 'sire')}
                        value={dog.sire}
                        onFocus={() => setActiveField({ index, field: 'sire' })}
                        onChange={(event) => handleChange(index, 'sire', event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, index, 'sire')}
                      />
                      {renderSuggestions(index, 'sire')}
                    </td>
                    <td className="relative px-2 py-1.5">
                      <CellInput
                        name="dam"
                        aria-label={`Row ${index + 1} dam`}
                        autoComplete="off"
                        ref={(el) => {
                          inputRefs.current[`dam-${index}`] = el;
                        }}
                        invalid={rowInvalid(index, 'dam')}
                        value={dog.dam}
                        onFocus={() => setActiveField({ index, field: 'dam' })}
                        onChange={(event) => handleChange(index, 'dam', event.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, index, 'dam')}
                      />
                      {renderSuggestions(index, 'dam')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PanelFooter>
            <Button variant="secondary" onClick={() => navigate('/dogs/all')} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={saving} disabled={!hunt}>
              Save dogs
            </Button>
          </PanelFooter>
        </Panel>
      </div>
    </>
  );
}

export default AddDogs;
