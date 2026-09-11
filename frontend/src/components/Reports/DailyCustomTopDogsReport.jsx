import PropTypes from 'prop-types';
import { useState } from 'react';
import DogService from '../../services/DogService';
import { configShape, DaySelect, LimitInput, OptionsRow, StakeSelect } from './OptionControls';

export const DailyCustomLimitSelector = ({ onChange, config }) => {
  const [day, setDay] = useState(config?.day ?? 1);
  const [limit, setLimit] = useState(config?.limit ?? 10);
  const [stakeType, setStakeType] = useState(config?.stakeType ?? 'ALL');

  const update = (next) => {
    const merged = { day, limit, stakeType, ...next };
    setDay(merged.day);
    setLimit(merged.limit);
    setStakeType(merged.stakeType);
    onChange({ day: parseInt(merged.day, 10), limit: parseInt(merged.limit, 10) || 1, stakeType: merged.stakeType });
  };

  return (
    <OptionsRow>
      <DaySelect value={day} onChange={(value) => update({ day: value })} />
      <LimitInput value={limit} onChange={(value) => update({ limit: value })} />
      <StakeSelect value={stakeType} onChange={(value) => update({ stakeType: value })} />
    </OptionsRow>
  );
};

DailyCustomLimitSelector.propTypes = { onChange: PropTypes.func.isRequired, config: configShape };

const columns = ['Place', 'Total', 'S&D', 'Dog', 'Name', 'Sire', 'Dam', 'Owner'];

const DailyCustomTopDogsReport = {
  title: 'Daily top dogs',
  description: 'The leading dogs on one day, with endurance added, for any number of places and stake.',
  configComponent: 'DailyCustomLimitSelector',
  defaultConfig: { day: 1, limit: 10, stakeType: 'ALL' },

  fetchData: async (config = { day: 1, limit: 10, stakeType: 'ALL' }) => {
    const { day, limit, stakeType } = config;
    const stakeLabel = stakeType === 'ALL' ? 'all dogs' : stakeType === 'ALL_AGE' ? 'all age' : 'derby';
    const title = `Day ${day} top ${limit}, ${stakeLabel}`;
    try {
      const topDogs =
        stakeType === 'ALL' ? await DogService.getTopScoringDogsByDay(day, limit) : await DogService.getTopScoringDogsByDayAndStakeType(day, stakeType, limit);
      return {
        title,
        columns,
        data: (Array.isArray(topDogs) ? topDogs : []).map((dog, index) => [
          (index + 1).toString(),
          (dog.dayTotal ?? dog.totalPoints + Math.floor((dog.totalPoints * day) / 10)).toString(),
          dog.totalPoints.toString(),
          dog.dogNumber.toString(),
          dog.dogName || '',
          dog.sire || '',
          dog.dam || '',
          dog.owner || '',
        ]),
      };
    } catch (error) {
      console.error('Error fetching daily top dogs report data:', error);
      return { title, columns, data: [] };
    }
  },
};

export default DailyCustomTopDogsReport;
