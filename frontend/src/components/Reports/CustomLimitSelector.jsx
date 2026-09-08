import PropTypes from 'prop-types';
import { useState } from 'react';
import { configShape, LimitInput, OptionsRow, StakeSelect } from './OptionControls';

export const CustomLimitSelector = ({ onChange, config }) => {
  const [limit, setLimit] = useState(config?.limit ?? 10);
  const [stakeType, setStakeType] = useState(config?.stakeType ?? 'ALL');

  const update = (next) => {
    const merged = { limit, stakeType, ...next };
    setLimit(merged.limit);
    setStakeType(merged.stakeType);
    onChange({ limit: parseInt(merged.limit, 10) || 1, stakeType: merged.stakeType });
  };

  return (
    <OptionsRow>
      <LimitInput value={limit} onChange={(value) => update({ limit: value })} />
      <StakeSelect value={stakeType} onChange={(value) => update({ stakeType: value })} />
    </OptionsRow>
  );
};

CustomLimitSelector.propTypes = { onChange: PropTypes.func.isRequired, config: configShape };

export default CustomLimitSelector;
