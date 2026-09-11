import PropTypes from 'prop-types';
import { useState } from 'react';
import DogService from '../../services/DogService';
import { dogLabel } from './format';
import { configShape, LimitInput, OptionsRow, StakeSelect } from './OptionControls';

export const OverallTopDogsLimitSelector = ({ onChange, config }) => {
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

OverallTopDogsLimitSelector.propTypes = { onChange: PropTypes.func.isRequired, config: configShape };

const columns = ['Place', 'Total S&D', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Dog', 'Name', 'Owner'];

function scoreForDay(dog, day) {
  const value = dog[`sdScore${day}`];
  return value === undefined || value === null ? 0 : parseInt(value, 10) || 0;
}

const SpeedAndDriveO = {
  title: 'Overall speed and drive',
  description: 'Speed and drive totals across the hunt with the daily breakdown, the final sheet.',
  configComponent: 'OverallTopDogsLimitSelector',
  defaultConfig: { limit: 10, stakeType: 'ALL' },

  fetchData: async (config = { limit: 10, stakeType: 'ALL' }) => {
    const { limit, stakeType } = config;
    const stakeLabel = stakeType === 'ALL' ? 'all dogs' : stakeType === 'ALL_AGE' ? 'all age' : 'derby';
    const title = `Overall speed and drive, ${stakeLabel}`;
    try {
      const dogScores = stakeType === 'ALL' ? await DogService.getTopScoringDogsOverall(limit) : await DogService.getTopScoringDogsByStakeType(stakeType, limit);
      return {
        title,
        columns,
        data: (Array.isArray(dogScores) ? dogScores : []).map((dog, index) => {
          const days = [1, 2, 3, 4].map((day) => scoreForDay(dog, day));
          const total = days.reduce((sum, value) => sum + value, 0);
          return [(index + 1).toString(), total.toString(), ...days.map(String), dog.dogNumber.toString(), dogLabel(dog), dog.owner || ''];
        }),
      };
    } catch (error) {
      console.error('Error fetching overall speed and drive report:', error);
      return { title, columns, data: [] };
    }
  },
};

export default SpeedAndDriveO;
