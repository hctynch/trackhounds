import PropTypes from 'prop-types';
import { useState } from 'react';
import DogService from '../../services/DogService';
import { dogLabel } from './format';
import { configShape, DaySelect, OptionsRow } from './OptionControls';

export const DaySelector = ({ onChange, config }) => {
  const [day, setDay] = useState(config?.day ?? 1);
  return (
    <OptionsRow>
      <DaySelect
        value={day}
        onChange={(value) => {
          setDay(value);
          onChange({ day: parseInt(value, 10) });
        }}
      />
    </OptionsRow>
  );
};

DaySelector.propTypes = { onChange: PropTypes.func.isRequired, config: configShape };

const columns = ['Place', 'Score', 'Dog', 'Name', 'Sire', 'Dam', 'Owner'];

const DogScoresByDayReport = {
  title: 'Top ten by day',
  description: 'The ten leading dogs on one day, with endurance added.',
  configComponent: 'DaySelector',
  defaultConfig: { day: 1 },

  fetchData: async (config = { day: 1 }) => {
    const { day } = config;
    const topDogs = await DogService.getTop10ScoringDogsByDay(day);
    return {
      title: `Day ${day} top ten`,
      columns,
      data: (Array.isArray(topDogs) ? topDogs : []).map((dog, index) => [
        (index + 1).toString(),
        (dog.dayTotal ?? dog.totalPoints + Math.floor((dog.totalPoints * day) / 10)).toString(),
        dog.dogNumber.toString(),
        dogLabel(dog),
        dog.sire || '',
        dog.dam || '',
        dog.owner || '',
      ]),
    };
  },
};

export default DogScoresByDayReport;
