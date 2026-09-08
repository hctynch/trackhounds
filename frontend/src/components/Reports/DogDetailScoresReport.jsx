import PropTypes from 'prop-types';
import { useState } from 'react';
import DogService from '../../services/DogService';
import { configShape, DaySelect, NumberInput, OptionsRow } from './OptionControls';

export const DogNumberSelector = ({ onChange, config }) => {
  const [dogNumber, setDogNumber] = useState(config?.dogNumber ?? '');
  const [day, setDay] = useState(config?.day ? String(config.day) : 'all');

  const update = (next) => {
    const merged = { dogNumber, day, ...next };
    setDogNumber(merged.dogNumber);
    setDay(merged.day);
    if (merged.dogNumber) {
      onChange({ dogNumber: parseInt(merged.dogNumber, 10), day: merged.day === 'all' ? null : parseInt(merged.day, 10) });
    }
  };

  return (
    <OptionsRow>
      <NumberInput label="Dog number" value={dogNumber} onChange={(value) => update({ dogNumber: value })} autoFocus />
      <DaySelect value={day} onChange={(value) => update({ day: value })} allowAll />
    </OptionsRow>
  );
};

DogNumberSelector.propTypes = { onChange: PropTypes.func.isRequired, config: configShape };

const columns = ['Day', 'Time', 'Judge', 'Score', 'Counted'];

const DogDetailScoresReport = {
  title: 'Scores for one dog',
  description: 'Every cross recorded for a dog, and whether it counted, optionally for a single day.',
  configComponent: 'DogNumberSelector',

  fetchData: async (config = {}) => {
    const { dogNumber, day } = config;
    if (!dogNumber) {
      return { title: 'Scores for one dog', columns, data: [] };
    }
    try {
      const dog = await DogService.getDogByNumber(dogNumber);
      const scores = day ? await DogService.getScoresByDogNumberAndDay(dogNumber, day) : await DogService.getScoresByDogNumber(dogNumber);
      const name = dog && dog.name ? ` ${dog.name}` : '';
      return {
        title: `Dog ${dogNumber}${name}, ${day ? `day ${day}` : 'all days'}`,
        columns,
        data: (Array.isArray(scores) ? scores : []).map((score) => [
          score.day.toString(),
          score.time,
          score.judgeNumber.toString(),
          score.points.toString(),
          score.counted ? 'Yes' : '',
        ]),
      };
    } catch (error) {
      console.error('Error fetching dog scores:', error);
      return { title: `Dog ${dogNumber}`, columns, data: [] };
    }
  },
};

export default DogDetailScoresReport;
