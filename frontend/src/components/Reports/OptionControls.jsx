import PropTypes from 'prop-types';
import { useHunt } from '../../hooks/useHunt';
import { huntDays } from '../../lib/hunt';
import { Field, Input, Select } from '../ui';

/** Shared controls for report options so every report's toolbar looks and behaves the same. */
export function OptionsRow({ children }) {
  return <div className="flex flex-wrap items-end gap-4">{children}</div>;
}

OptionsRow.propTypes = { children: PropTypes.node };

export function DaySelect({ value, onChange, allowAll = false }) {
  const { hunt } = useHunt();
  return (
    <Field label="Day" className="w-32">
      {({ id }) => (
        <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
          {allowAll && <option value="all">All days</option>}
          {huntDays(hunt).map((day) => (
            <option key={day} value={day}>
              Day {day}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

DaySelect.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onChange: PropTypes.func.isRequired,
  allowAll: PropTypes.bool,
};

export function StakeSelect({ value, onChange, allowAll = true }) {
  return (
    <Field label="Stake" className="w-36">
      {({ id }) => (
        <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
          {allowAll && <option value="ALL">All dogs</option>}
          <option value="ALL_AGE">All age</option>
          <option value="DERBY">Derby</option>
        </Select>
      )}
    </Field>
  );
}

StakeSelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  allowAll: PropTypes.bool,
};

export function LimitInput({ value, onChange }) {
  return (
    <Field label="Number of dogs" className="w-32">
      {({ id }) => <Input id={id} type="number" numeric min={1} max={500} value={value} onChange={(event) => onChange(event.target.value)} />}
    </Field>
  );
}

LimitInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onChange: PropTypes.func.isRequired,
};

export function NumberInput({ label, value, onChange, autoFocus = false, text = false }) {
  return (
    <Field label={label} className="w-36">
      {({ id }) =>
        text ? (
          <Input id={id} type="text" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} className="tabular" autoFocus={autoFocus} />
        ) : (
          <Input id={id} type="number" numeric min={1} value={value} onChange={(event) => onChange(event.target.value)} autoFocus={autoFocus} />
        )
      }
    </Field>
  );
}

NumberInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onChange: PropTypes.func.isRequired,
  autoFocus: PropTypes.bool,
  text: PropTypes.bool,
};

export const configShape = PropTypes.object;
