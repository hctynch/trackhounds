import PropTypes from 'prop-types';
import { useState } from 'react';
import DogService from '../../services/DogService';
import { configShape, DaySelect, NumberInput, OptionsRow } from './OptionControls';

export const JudgeNumberSelector = ({ onChange, config }) => {
  const [judgeNumber, setJudgeNumber] = useState(config?.judgeNumber ?? '');
  const [day, setDay] = useState(config?.day ? String(config.day) : 'all');

  const update = (next) => {
    const merged = { judgeNumber, day, ...next };
    setJudgeNumber(merged.judgeNumber);
    setDay(merged.day);
    if (merged.judgeNumber) {
      onChange({ judgeNumber: parseInt(merged.judgeNumber, 10), day: merged.day === 'all' ? null : parseInt(merged.day, 10) });
    }
  };

  return (
    <OptionsRow>
      <NumberInput label="Judge number" value={judgeNumber} onChange={(value) => update({ judgeNumber: value })} autoFocus />
      <DaySelect value={day} onChange={(value) => update({ day: value })} allowAll />
    </OptionsRow>
  );
};

JudgeNumberSelector.propTypes = { onChange: PropTypes.func.isRequired, config: configShape };

const columns = ['Day', 'Time', 'Dog', 'Score', 'Counted'];

const JudgeDetailScoresReport = {
  title: 'Scores by one judge',
  description: 'Every cross a judge recorded, optionally for a single day.',
  configComponent: 'JudgeNumberSelector',

  fetchData: async (config = {}) => {
    const { judgeNumber, day } = config;
    if (!judgeNumber) {
      return { title: 'Scores by one judge', columns, data: [] };
    }
    try {
      const scores = day ? await DogService.getScoresByJudgeNumberAndDay(judgeNumber, day) : await DogService.getScoresByJudgeNumber(judgeNumber);
      return {
        title: `Judge ${judgeNumber}, ${day ? `day ${day}` : 'all days'}`,
        columns,
        data: (Array.isArray(scores) ? scores : []).map((score) => [
          score.day.toString(),
          score.time,
          score.dogNumber.toString(),
          score.points.toString(),
          score.counted ? 'Yes' : '',
        ]),
      };
    } catch (error) {
      console.error('Error fetching judge scores:', error);
      return { title: `Judge ${judgeNumber}`, columns, data: [] };
    }
  },
};

export default JudgeDetailScoresReport;
