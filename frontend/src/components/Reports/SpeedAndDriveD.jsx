import PropTypes from 'prop-types';
import { useState } from 'react';
import DogService from '../../services/DogService';
import { configShape, DaySelect, LimitInput, OptionsRow, StakeSelect } from './OptionControls';

export const DailySpeedAndDriveLimitSelector = ({ onChange, config }) => {
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

DailySpeedAndDriveLimitSelector.propTypes = { onChange: PropTypes.func.isRequired, config: configShape };

const columns = ['Place', 'Score', 'Dog', 'Name', 'Sire', 'Dam', 'Owner'];

const SpeedAndDriveD = {
  title: 'Daily speed and drive',
  description: 'Speed and drive rankings for one day, the sheet posted at the end of each day.',
  configComponent: 'DailySpeedAndDriveLimitSelector',
  defaultConfig: { limit: 10, stakeType: 'ALL', day: 1 },

  fetchData: async (config = { limit: 10, stakeType: 'ALL', day: 1 }) => {
    const { limit, stakeType, day } = config;
    const stakeLabel = stakeType === 'ALL' ? 'all dogs' : stakeType === 'ALL_AGE' ? 'all age' : 'derby';
    const title = `Day ${day} speed and drive, ${stakeLabel}`;
    try {
      const dogScores =
        stakeType === 'ALL' ? await DogService.getTopScoringDogsByDay(day, limit) : await DogService.getTopScoringDogsByDayAndStakeType(day, stakeType, limit);
      return {
        title,
        columns,
        data: (Array.isArray(dogScores) ? dogScores : []).map((dog, index) => [
          (index + 1).toString(),
          dog.totalPoints.toString(),
          dog.dogNumber.toString(),
          dog.dogName || '',
          dog.sire || '',
          dog.dam || '',
          dog.owner || '',
        ]),
      };
    } catch (error) {
      console.error('Error fetching daily speed and drive report:', error);
      return { title, columns, data: [] };
    }
  },
};

export default SpeedAndDriveD;
