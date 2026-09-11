import PropTypes from 'prop-types';
import { useState } from 'react';
import DogService from '../../services/DogService';
import { configShape, DaySelect, OptionsRow, StakeSelect } from './OptionControls';

export const DayAndStakeTypeSelector = ({ onChange, config }) => {
  const [day, setDay] = useState(config?.day ?? 1);
  const [stakeType, setStakeType] = useState(config?.stakeType ?? 'ALL_AGE');

  const update = (next) => {
    const merged = { day, stakeType, ...next };
    setDay(merged.day);
    setStakeType(merged.stakeType);
    onChange({ day: parseInt(merged.day, 10), stakeType: merged.stakeType });
  };

  return (
    <OptionsRow>
      <DaySelect value={day} onChange={(value) => update({ day: value })} />
      <StakeSelect value={stakeType} onChange={(value) => update({ stakeType: value })} allowAll={false} />
    </OptionsRow>
  );
};

DayAndStakeTypeSelector.propTypes = { onChange: PropTypes.func.isRequired, config: configShape };

const columns = ['Place', 'Score', 'Dog', 'Name', 'Sire', 'Dam', 'Owner'];

const TopDogsByDayAndStakeTypeReport = {
  title: 'Top ten by day and stake',
  description: 'The ten leading dogs of one stake on one day, with endurance added.',
  configComponent: 'DayAndStakeTypeSelector',
  defaultConfig: { day: 1, stakeType: 'ALL_AGE' },

  fetchData: async (config = { day: 1, stakeType: 'ALL_AGE' }) => {
    const { day, stakeType } = config;
    const topDogs = await DogService.getTop10ScoringDogsByDayAndStakeType(day, stakeType);
    return {
      title: `Day ${day} top ten, ${stakeType === 'ALL_AGE' ? 'all age' : 'derby'}`,
      columns,
      data: (Array.isArray(topDogs) ? topDogs : []).map((dog, index) => [
        (index + 1).toString(),
        (dog.dayTotal ?? dog.totalPoints + Math.floor((dog.totalPoints * day) / 10)).toString(),
        dog.dogNumber.toString(),
        dog.dogName || '',
        dog.sire || '',
        dog.dam || '',
        dog.owner || '',
      ]),
    };
  },
};

export default TopDogsByDayAndStakeTypeReport;
