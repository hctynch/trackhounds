import PropTypes from 'prop-types';
import { askedFilters } from '../../lib/reports';
import { DaySelect, LimitInput, NumberInput, OptionsRow, StakeSelect } from './OptionControls';

/**
 * The questions a definition asks when its sheet is opened: one control per filter marked "ask".
 * `answers` holds the current values; the sheet re-runs whenever one changes.
 */
function DefinitionOptions({ definition, answers, onChange }) {
  const asked = askedFilters(definition);
  if (asked.length === 0) return null;
  const set = (key, value) => onChange({ ...answers, [key]: value });
  const allowAll = Boolean(definition.filters?.dayAllowAll);
  return (
    <OptionsRow>
      {asked.includes('dogNumber') && <NumberInput label="Dog number" value={answers.dogNumber ?? ''} onChange={(value) => set('dogNumber', value)} autoFocus text />}
      {asked.includes('judgeNumber') && <NumberInput label="Judge number" value={answers.judgeNumber ?? ''} onChange={(value) => set('judgeNumber', value)} autoFocus={!asked.includes('dogNumber')} />}
      {asked.includes('day') && <DaySelect value={answers.day ?? (allowAll ? 'all' : 1)} onChange={(value) => set('day', value)} allowAll={allowAll} />}
      {asked.includes('limit') && <LimitInput value={answers.limit ?? 10} onChange={(value) => set('limit', value)} />}
      {asked.includes('stake') && <StakeSelect value={answers.stake ?? 'ALL'} onChange={(value) => set('stake', value)} />}
    </OptionsRow>
  );
}

DefinitionOptions.propTypes = {
  definition: PropTypes.object.isRequired,
  answers: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default DefinitionOptions;
