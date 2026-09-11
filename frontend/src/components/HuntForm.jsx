import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Alert, Button, Field, Input, Panel, PanelBody, PanelFooter, PanelHeader, STAKE_LABELS, SegmentedControl, Select } from './ui';

const STAKES = ['ALL_AGE', 'DERBY', 'DUAL'].map((value) => ({ value, label: STAKE_LABELS[value] }));
const RANGE_STAKES = ['ALL_AGE', 'DERBY'];

export const emptyHunt = {
  title: '',
  dates: '',
  huntInterval: 5,
  pointStep: 5,
  stake: 'ALL_AGE',
  stakeTypeRange: ['ALL_AGE', 'ALL_AGE', 'ALL_AGE', 'ALL_AGE'],
  stakeRange: [0, 0, 0, 0],
};

function validate(values) {
  const errors = {};
  if (!values.title || values.title.trim().length < 1) errors.title = 'Give the hunt a title.';
  if (Number(values.huntInterval) < 0) errors.interval = 'The interval cannot be negative.';
  if (Number(values.pointStep) < 0) errors.pointStep = 'The point step cannot be negative.';
  values.stakeRange.forEach((start, index) => {
    if (Number(start) < 0) errors[`startingNumber${index + 1}`] = 'Starting numbers cannot be negative.';
  });
  if (values.stake === 'DUAL') {
    const hasAllAge = values.stakeTypeRange.includes('ALL_AGE');
    const hasDerby = values.stakeTypeRange.includes('DERBY');
    if (!hasAllAge || !hasDerby) errors.stake = 'A dual stake needs at least one all-age range and one derby range.';
  }
  return errors;
}

/**
 * Create and edit share one form. `initial` fills the fields; `onSubmit` receives the hunt payload
 * and may return a map of field errors from the server.
 */
function HuntForm({ initial = emptyHunt, onSubmit, onCancel, submitLabel = 'Save hunt', title, description }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  // A dual stake always starts with one range of each type so the ranges make sense.
  useEffect(() => {
    if (values.stake !== 'DUAL') return;
    setValues((current) => {
      const next = [...current.stakeTypeRange];
      if (!next.includes('ALL_AGE')) next[0] = 'ALL_AGE';
      if (!next.includes('DERBY')) next[1] = 'DERBY';
      return next.join() === current.stakeTypeRange.join() ? current : { ...current, stakeTypeRange: next };
    });
  }, [values.stake]);

  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const setRange = (index, field, value) =>
    setValues((current) => {
      const next = [...current[field]];
      next[index] = value;
      return { ...current, [field]: next };
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    const payload = {
      title: values.title.trim(),
      dates: values.dates,
      stake: values.stake,
      huntInterval: Number(values.huntInterval),
      pointStep: Number(values.pointStep),
      stakeTypeRange: values.stakeTypeRange,
      stakeRange: values.stakeRange.map(Number),
    };
    const serverErrors = await onSubmit(payload);
    setSaving(false);
    if (serverErrors) setErrors(serverErrors);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title={title} description={description} />
            <PanelBody className="flex flex-col gap-4">
              <Field label="Title" required error={errors.title}>
                {({ id, invalid }) => (
                  <Input id={id} invalid={invalid} value={values.title} onChange={set('title')} placeholder="Spring Trial 2026" autoFocus />
                )}
              </Field>
              <Field label="Dates" hint="Free text, printed on every report.">
                {({ id }) => <Input id={id} value={values.dates} onChange={set('dates')} placeholder="March 14 to 17, 2026" />}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Scoring interval (minutes)"
                  hint="Counted from the day's start time. Only a dog's highest cross in each interval is scored."
                  error={errors.interval}
                >
                  {({ id, invalid }) => (
                    <Input id={id} type="number" numeric min={0} invalid={invalid} value={values.huntInterval} onChange={set('huntInterval')} />
                  )}
                </Field>
                <Field
                  label="Point step"
                  hint="Points deducted for each following dog in a cross. Normally 5."
                  error={errors.pointStep}
                >
                  {({ id, invalid }) => (
                    <Input id={id} type="number" numeric min={0} invalid={invalid} value={values.pointStep} onChange={set('pointStep')} />
                  )}
                </Field>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Stake" description="Which stakes run in this hunt" />
            <PanelBody className="flex flex-col gap-3">
              <SegmentedControl
                label="Stake"
                options={STAKES}
                value={values.stake}
                onChange={(stake) => setValues((current) => ({ ...current, stake }))}
                className="self-start"
              />
              {values.stake === 'DUAL' && (
                <Alert tone="info">A dual stake scores all-age and derby dogs separately in each cross. Assign dog numbers to stakes with the ranges.</Alert>
              )}
              {errors.stake && <Alert tone="danger">{errors.stake}</Alert>}
            </PanelBody>
          </Panel>
        </div>

        <Panel className="self-start">
          <PanelHeader
            title="Number ranges"
            description="Dogs get their stake from their number. Each range starts at the number given and runs up to the next range."
          />
          <PanelBody className="flex flex-col divide-y divide-line" padded={false}>
            {values.stakeRange.map((start, index) => (
              <div key={index} className="grid grid-cols-[auto_1fr_1fr] items-end gap-3 px-5 py-3">
                <span className="pb-2 font-serif text-[17px] text-ink-muted tabular">{index + 1}</span>
                <Field label="Stake">
                  {({ id }) => (
                    <Select id={id} value={values.stakeTypeRange[index]} onChange={(event) => setRange(index, 'stakeTypeRange', event.target.value)}>
                      {RANGE_STAKES.map((stake) => (
                        <option key={stake} value={stake}>
                          {STAKE_LABELS[stake]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Starts at" error={errors[`startingNumber${index + 1}`]}>
                  {({ id, invalid }) => (
                    <Input
                      id={id}
                      type="number"
                      numeric
                      min={0}
                      invalid={invalid}
                      value={start}
                      onChange={(event) => setRange(index, 'stakeRange', event.target.value)}
                    />
                  )}
                </Field>
              </div>
            ))}
          </PanelBody>
          <PanelFooter className="justify-start">
            <p className="text-small text-ink-muted">Leave every range at 0 if all dogs share one stake.</p>
          </PanelFooter>
        </Panel>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

HuntForm.propTypes = {
  initial: PropTypes.shape({
    title: PropTypes.string,
    dates: PropTypes.string,
    huntInterval: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    pointStep: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stake: PropTypes.string,
    stakeTypeRange: PropTypes.arrayOf(PropTypes.string),
    stakeRange: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  submitLabel: PropTypes.string,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
};

export default HuntForm;
